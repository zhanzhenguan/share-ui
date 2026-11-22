<template>
  <div class="app-container">
    <!-- 搜索表单 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="编号" prop="powerBankNo">
        <el-input
          v-model="queryParams.powerBankNo"
          placeholder="请输入充电宝编号"
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
          v-hasPermi="['device:powerBank:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['device:powerBank:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['device:powerBank:remove']"
        >删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 数据展示表格 -->
    <el-table v-loading="loading" :data="powerBankList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" prop="powerBankNo" width="120" />
      <el-table-column label="电量" prop="electricity" width="100">
        <template #default="scope">
          {{ scope.row.electricity }}%
        </template>
      </el-table-column>
      <el-table-column label="描述" prop="description" show-overflow-tooltip />
      <el-table-column label="状态" prop="status" width="80">
        <template #default="scope">
          {{
            scope.row.status == '0' ? '未投放' :
            scope.row.status == '1' ? '可用' :
            scope.row.status == '2' ? '已租用' :
            scope.row.status == '3' ? '充电中' : '故障'
          }}
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['device:powerBank:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['device:powerBank:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页条组件 -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="powerBankRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="编号" prop="powerBankNo">
          <el-input v-model="form.powerBankNo" placeholder="请输入充电宝编号" />
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

<script setup name="PowerBank">
import {
  listPowerBank,
  addPowerBank,
  getPowerBank,
  updatePowerBank,
  delPowerBank
} from "@/api/device/powerBank";
import { ElMessage, ElMessageBox } from "element-plus";

const { proxy } = getCurrentInstance();

const powerBankList = ref([]);
const total = ref(0);
const loading = ref(true);
const showSearch = ref(true);
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
    powerBankNo: null
  },
  rules: {
    powerBankNo: [
      { required: true, message: "充电宝编号不能为空", trigger: "blur" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询充电宝列表 */
function getList() {
  loading.value = true;
  listPowerBank(queryParams.value).then(response => {
    powerBankList.value = response.rows;
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
  title.value = "添加充电宝";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const id = row?.id || ids.value[0];
  getPowerBank(id).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改充电宝";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["powerBankRef"].validate(valid => {
    if (!valid) {
      return;
    }
    if (form.value.id != null) {
      updatePowerBank(form.value).then(() => {
        ElMessage.success("修改成功");
        open.value = false;
        getList();
      });
    } else {
      addPowerBank(form.value).then(() => {
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
  ElMessageBox.confirm("是否确认删除充电宝数据项？", "系统提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    return delPowerBank(idList);
  }).then(() => {
    getList();
    ElMessage.success("删除成功");
  }).catch(() => {});
}

/** 表单重置 */
function reset() {
  form.value = {
    id: null,
    powerBankNo: null,
    electricity: null,
    description: null,
    status: null,
    createTime: null,
    remark: null
  };
  proxy.resetForm("powerBankRef");
}

/** 取消按钮 */
function cancel() {
  open.value = false;
  reset();
}

getList();
</script>
