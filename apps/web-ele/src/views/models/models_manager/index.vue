<script lang="ts" setup>
import { requestModelClient } from '#/api/request';
import { Page } from '@vben/common-ui';
import { Search, RotateCw } from '@vben/icons';
import { ElButton, ElDialog, ElCard, ElTable, ElTableColumn, ElInput, ElPagination, ElForm, ElFormItem, ElMessageBox } from 'element-plus';
import { computed, onMounted, reactive, ref } from 'vue';
import type { FormModel, ModelData, PageResult } from './model';

const formData = ref<ModelData[]>([])
const searchInput = ref<string>('');
const currentPage = ref<number>(1);
const pageSize = ref<number>(10);
const totalNum = ref<number>(0);
const openModal = ref<boolean>(false);
const isDetail = ref<boolean>(false);
const isCreate = ref<boolean>(false);
const isUpdate = ref<boolean>(false);

const data = reactive<{ form: FormModel }>({
  form: {name: ''}
})

const getData = (row: ModelData) => {
  isDetail.value = true;
  isCreate.value = false;
  isUpdate.value = false;
  data.form = JSON.parse(JSON.stringify(row));
  openModal.value = true;
}

const createData = (): void => {
  isDetail.value = false;
  isCreate.value = true;
  isUpdate.value = false;
  data.form = {name: ''};
  openModal.value = true;
}

const updateData = (row: ModelData): void => {
  isDetail.value = false;
  isCreate.value = false;
  isUpdate.value = true;
  data.form = JSON.parse(JSON.stringify(row));
  openModal.value = true;
}

const handleOk = (): void => {
  if (isCreate.value) {
    add();
  } else if (isUpdate.value) {
    update();
  }
  openModal.value = false;
  isDetail.value = false;
  isCreate.value = false;
  isUpdate.value = false;
}

const modalName = computed<string>(() => {
  if (isDetail.value) {
    return '数据详情';
  } else if (isCreate.value) {
    return '新建数据';
  } else if (isUpdate.value) {
    return '修改数据';
  }
  return ''
})

// const handleSuccess = () => {
  
// }

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

const del = async (row: FormModel): Promise<void> => {
  try {
    await ElMessageBox.confirm("是否删除数据？删除后不可恢复", "删除确认", {type: 'warning'});
    await requestModelClient.delete('/model/deleteById/' + row.id);
    await load();
  } catch (err) {
    console.error("删除模型失败, ", err);
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

<template>
  <Page>
    <el-card shadow="hover" :body-style="{ padding: '20px' }">
      <template #header>
        <div class="flex">
          <span style="font-weight: bold; align-items: center; display: flex; font-size: 22px;">模型列表</span>
          <div class="flex flex-1"></div>
          <el-input v-model="searchInput" placeholder="请输入" :prefix-icon="Search" style="width: 200px; margin-right: 12px;" clearable />
          <el-button type="primary" @click="load">搜索</el-button>
          
          <el-button type="default" class="ml-3" circle @click="reload">
            <template #icon>
              <RotateCw />
            </template>
          </el-button>
          <el-button type="primary" class="ml-3" @click="createData">新增</el-button>
        
        </div>
      </template>
      <el-table :data="formData" stripe @selection-change="" >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="模型名称" />
        <el-table-column prop="uploadTime" label="上传时间" />
        <el-table-column label="操作">
          <template #default="scoped">
            <el-button type="default" plain @click="getData(scoped.row)">详情</el-button>
            <el-button type="warning" plain @click="updateData(scoped.row)">修改</el-button>
            <el-button type="primary" plain @click="">下载</el-button>
            <el-button type="danger" plain @click="del(scoped.row)">删除</el-button>

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
      width="30%"
    >
      <el-form :model="data.form" ref="form" label-width="80px" :inline="false">
        <el-form-item label="">
          <el-input v-model="data.form.name" placeholder="请输入名称"></el-input>
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

<style scoped>
</style>
