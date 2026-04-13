// 模型列表数据接口
export interface ModelData {
  id: number,
  name: string,
  url: string,
  uploadTime: string,
}

// 分页返回结果通用接口
export interface PageResult<T> {
  list: T[],
  total: number,
}

// 表单操作数据接口
export interface FormModel {
  id?: number,
  name: string,
  url: string,
  remark: string,
}

export interface HttpResponse {
  code: number;
  msg: string;
  data: string;
}

export interface UploadFile {
  name: string;
  url: string;
}

export interface PartData {
  id: number;
  name: string;
}