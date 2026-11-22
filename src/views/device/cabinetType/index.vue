<template>
  <div class="app-container">

    <!-- 搜索表单 -->
    <el-form ref="queryRef" :model="queryParams" :inline="true" label-width="68px">
      <el-form-item label="名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 功能按钮栏 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['device:cabinetType:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
        >删除</el-button>
      </el-col>
    </el-row>

    <!-- 数据展示表格 -->
    <el-table v-loading="loading" :data="cabinetTypeList" 
          @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="名称" prop="name" width="150"/>
      <el-table-column label="总插槽数量" prop="totalSlots" width="110"/>
      <el-table-column label="描述" prop="description" />
      <el-table-column label="状态" prop="status" width="100">
        <template #default="scope">
          {{ scope.row.status == '1' ? '正常' : '停用' }}
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页条组件 -->
    <pagination
        v-show="total>0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
    />

    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="cabinetTypeRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="总插槽数量" prop="totalSlots">
          <el-select
              v-model="form.totalSlots"
              class="m-2"
              placeholder="请选择总插槽数量"
              style="width: 100%"
          >
            <el-option
                v-for="item in 20"
                :key="item"
                :label="item"
                :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>
  
<script setup name="CabinetType">
import {
  listCabinetType,
  addCabinetType,
  getCabinetType,
  updateCabinetType,
  delCabinetType
} from "@/api/device/cabinetType";
import { ElMessage, ElMessageBox } from "element-plus";

const { proxy } = getCurrentInstance();

const cabinetTypeList = ref([]);
const total = ref(0);
const loading = ref(true);
const open = ref(false);
const title = ref("");
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: null
  },
  rules: {
    name: [
      { required: true, message: "名称不能为空", trigger: "blur" }
    ],
    totalSlots: [
      { required: true, message: "请选择总插槽数量", trigger: "change" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询柜机类型列表 */
function getList() {
  loading.value = true;
  listCabinetType(queryParams.value).then(response => {
    cabinetTypeList.value = response.rows;
    total.value = response.total;
  }).finally(() => {
    loading.value = false;
  });
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加柜机类型";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const id = row?.id || ids.value[0];
  getCabinetType(id).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改柜机类型";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["cabinetTypeRef"].validate(valid => {
    if (!valid) {
      return;
    }
    if (form.value.id != null) {
      updateCabinetType(form.value).then(() => {
        ElMessage.success("修改成功");
        open.value = false;
        getList();
      });
    } else {
      addCabinetType(form.value).then(() => {
        ElMessage.success("新增成功");
        open.value = false;
        getList();
      });
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const idList = row?.id || ids.value;
  ElMessageBox.confirm("是否确认删除柜机类型数据项？", "系统提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    return delCabinetType(idList);
  }).then(() => {
    getList();
    ElMessage.success("删除成功");
  }).catch(() => {});
}

/** 表单重置 */
function reset() {
  form.value = {
    id: null,
    name: null,
    totalSlots: null,
    description: null,
    status: null,
    remark: null
  };
  proxy.resetForm("cabinetTypeRef");
}

/** 取消按钮 */
function cancel() {
  open.value = false;
  reset();
}

getList();
</script>