<template>
  <Page>
    <el-card shadow="hover" :body-style="{ padding: '20px' }">
      <template #header>
        <div class="flex">
          <span style="font-weight: bold; align-items: center; display: flex; font-size: 22px;">模型列表</span>
          <div class="flex flex-1"></div>
          <el-input v-model="searchInput" placeholder="请输入" :prefix-icon="Search" style="width: 200px; margin-right: 12px;" clearable />
          <el-button type="primary" @click="load">搜索</el-button>
          <el-button type="default" class="ml-3" circle :icon="RefreshRight" @click="reload"></el-button>
          <el-button type="primary" class="ml-3" @click="handleCreate">新增</el-button>
          <el-button type="danger" class="ml-3" :disabled="!ids.length" @click="handleDeleteBatch">批量删除</el-button>
        </div>
      </template>
      <el-table :data="formData" stripe @selection-change="handleSelectChange" >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="模型名称" />
        <el-table-column prop="remark" label="备注" />
        <el-table-column prop="uploadTime" label="上传时间" />
        <el-table-column label="操作">
          <template #default="scoped">
            <el-button type="default" plain @click="handlePreview(scoped.row)">预览</el-button>
            <el-button type="warning" plain @click="handleUpdate(scoped.row)">修改</el-button>
            <el-button type="primary" plain @click="handleDownload(scoped.row)">下载</el-button>
            <el-button type="danger" plain @click="handleDelete(scoped.row)">删除</el-button>
          </template>

          
        </el-table-column>
        
      </el-table>
      <div class="flex flex-row mt-3 right-0">
        <div class="flex flex-1"></div>
        <el-pagination
          @size-change="load"
          @current-change="load"
          v-model:currentPage="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalNum"
          background
        >
        </el-pagination>
      </div>
    </el-card>

    <el-dialog
      :title="modalName"
      v-model="openModal"
      width="40%"
    >
      <el-form :model="data.form" ref="form" label-width="60px" :inline="false">
        <el-upload
        action="/api/models/files/upload"
        ref="upload"
        v-model:file-list="fileList"
        multiple
        drag
        :limit="1"
        :on-success="handleSuccess"
        :on-remove="handleRemove"
        :before-remove="beforeRemove"
        :on-exceed="handleExceed"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">拖拽到这 或 点击上传文件</div>
          <template #tip>
            推荐上传.glb文件
          </template>
        </el-upload>
        <el-form-item label="备注" class="mt-4">
          <el-input v-model="data.form.remark" placeholder="请输入备注"></el-input>
        </el-form-item>
        
      </el-form>
      
      <template #footer>
        <span>
        <el-button @click="openModal = false">取消</el-button>
        <el-button type="primary" @click="handleOk">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    
  </Page>
</template>

<script lang="ts" setup>
import { requestModelClient } from '#/api/request';
import { Page } from '@vben/common-ui';
import { ElButton, ElDialog, ElCard, ElTable, ElTableColumn, ElInput, ElPagination, ElForm, ElFormItem, ElMessageBox, ElUpload, ElMessage, ElIcon, type UploadProps } from 'element-plus';
import { UploadFilled, RefreshRight, Search } from '@element-plus/icons-vue';
import { computed, onMounted, reactive, ref } from 'vue';
import type { FormModel, HttpResponse, ModelData, PageResult, UploadFile } from './model';
import { useRouter } from 'vue-router';

const formData = ref<ModelData[]>([]);
const ids = ref<number[]>([]);
const searchInput = ref<string>('');
const currentPage = ref<number>(1);
const pageSize = ref<number>(10);
const totalNum = ref<number>(0);
const openModal = ref<boolean>(false);
const isCreate = ref<boolean>(false);
const isUpdate = ref<boolean>(false);
const fileList = ref<UploadFile[]>([]);

const router = useRouter();

const data = reactive<{ form: FormModel }>({
  form: {name: '', url: '', remark: ''}
})

const handleSelectChange = (rows: ModelData[]): void => {
  ids.value = rows.map(row => row.id);
}

const handleCreate = (): void => {
  fileList.value = [];
  isCreate.value = true;
  isUpdate.value = false;
  data.form = {name: '', url: '', remark: ''};
  openModal.value = true;
}

const handleUpdate = (row: ModelData): void => {
  isCreate.value = false;
  isUpdate.value = true;
  data.form = JSON.parse(JSON.stringify(row));
  // 处理应该如何显示数据
  setUploadFileList({ name: data.form.name, url: data.form.url })
  openModal.value = true;
}

const handleDownload = (row: ModelData): void => {
  window.open(row.url);
}

const handleOk = (): void => {
  if (isCreate.value) {
    add();
  } else if (isUpdate.value) {
    update();
  }
  openModal.value = false;
  isCreate.value = false;
  isUpdate.value = false;
}

const modalName = computed<string>(() => {
  if (isCreate.value) {
    return '新建数据';
  } else if (isUpdate.value) {
    return '修改数据';
  }
  return ''
})

const handleSuccess: UploadProps["onSuccess"] = (res: HttpResponse): void => {
  if (res.code === 200) {
    ElMessage.success("文件上传成功！");
    data.form.url = res.data;
  } else {
    ElMessage.error("文件上传失败！");
  }
}

const handleRemove: UploadProps["onRemove"] = (): void => {
  data.form.name = '';
  data.form.url = '';
}

const setUploadFileList = (fileInfo?: {name?: string, url?: string}) => {
  // 清空列表
  fileList.value = []

  if (fileInfo?.name && fileInfo?.url) {
    if (fileInfo.name != '' && fileInfo.url != '') {
      fileList.value.push({name: fileInfo.name, url: fileInfo.url});
    }
  }
}

const beforeRemove: UploadProps['beforeRemove'] = (uploadFile) => {
  return ElMessageBox.confirm(`是否删除${uploadFile.name}？`, "删除提示", {type: "warning"}).then(
    () => true,
    () => false,
  )
}

const handleExceed: UploadProps["onExceed"] = () => {
  ElMessage.error("请删除当前文件再上传，并确认是否删除当前文件！");
}

const handlePreview = (row: ModelData): void => {
  const previewUrl = `preview?glbUrl=${encodeURIComponent(row.url)}`;
  router.push(previewUrl);
}


const load = async (): Promise<void> => {
  try {
    const res = await requestModelClient.get<PageResult<ModelData>>('/model/selectAll', {
      params: {
        name: searchInput.value,
        currentPage: currentPage.value,
        pageSize: pageSize.value
      }
    })
    formData.value = res.list;
    totalNum.value = res.total;
  } catch (err) {
    console.error("加载列表数据失败, ", err);
  }
}

const add = async (): Promise<void> => {
  try {
    await requestModelClient.post('/model/add', data.form);
    await load();
  } catch (err) {
    console.error("新建数据失败, ", err);
  }
}

const update = async (): Promise<void> => {
  try {
    await requestModelClient.put('/model/update', data.form);
    await load();
  } catch (err) {
    console.error("修改信息失败, ", err);
  }
}

const handleDelete = async (row: FormModel): Promise<void> => {
  try {
    await ElMessageBox.confirm("是否删除数据？删除后不可恢复", "删除确认", {type: 'warning'});
    await requestModelClient.delete('/model/deleteById/' + row.id);
    await load();
  } catch (err) {
    console.log("取消删除模型：" + row.name);
  }
}

const handleDeleteBatch = async (): Promise<void> => {
  try {
    await ElMessageBox.confirm("是否批量删除？", "批量删除提示", {type: 'warning'});
    await requestModelClient.delete('/model/deleteBatch', {data: ids.value});
    await load();
    ElMessage.success("批量删除成功！");
  } catch (err) {
    console.error(err);
  }
}

const reload = (): void => {
  searchInput.value = '';
  load();
}

onMounted(() => {
  load();
})

</script>
