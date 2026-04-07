<template>
  <div class="transfer-page">
    <div class="page-header">
      <p class="page-kicker">TRANSFER FORM</p>
      <h1>转账表单</h1>
    </div>

    <section class="main-card">
      <el-form ref="transferForm" :model="form" :rules="rules" label-width="104px" class="main-form">
        <div class="form-strip">
          <div class="form-strip-item">
            <span class="form-strip-title">收款信息</span>
          </div>
          <div class="form-strip-item">
            <span class="form-strip-title">付款信息</span>
          </div>
        </div>

        <div class="form-grid">
          <section class="panel-section">
            <div class="panel-form">
            <el-form-item label="收款人" prop="payeeName" class="panel-form-item">
              <div class="bank-picker">
                <el-autocomplete
                  v-model="form.payeeName"
                  :fetch-suggestions="queryPayeeByName"
                  :trigger-on-focus="false"
                  :debounce="250"
                  placeholder="请输入收款人姓名，至少3个字开始匹配名册"
                  clearable
                  @input="handlePayeeFieldInput"
                  @select="handleRecipientPick"
                  @clear="handlePayeeClear"
                >
                  <template slot-scope="{ item }">
                    <div class="recipient-option">
                      <div class="recipient-option-main">{{ item.payeeName }}</div>
                      <div class="recipient-option-meta">
                        <span>{{ item.payeeAccount }}</span>
                        <span>{{ item.bankDisplayName }}</span>
                      </div>
                    </div>
                  </template>
                </el-autocomplete>
                <el-button type="primary" @click="openQuickDocumentDialog">快捷单据</el-button>
              </div>
            </el-form-item>

            <el-form-item label="收款人账号" prop="payeeAccount" class="panel-form-item">
              <el-autocomplete
                v-model="form.payeeAccount"
                :fetch-suggestions="queryPayeeByAccount"
                :trigger-on-focus="false"
                :debounce="250"
                placeholder="请输入收款人账号，至少3位开始匹配名册"
                clearable
                @input="handlePayeeFieldInput"
                @select="handleRecipientPick"
                @clear="handlePayeeClear"
              >
                <template slot-scope="{ item }">
                  <div class="recipient-option">
                    <div class="recipient-option-main">{{ item.payeeAccount }}</div>
                    <div class="recipient-option-meta">
                      <span>{{ item.payeeName }}</span>
                      <span>{{ item.bankDisplayName }}</span>
                    </div>
                  </div>
                </template>
              </el-autocomplete>
            </el-form-item>

            <el-form-item label="收款银行" prop="payeeBankName" class="panel-form-item">
              <div class="bank-picker">
                <el-input v-model="form.payeeBankName" placeholder="请选择收款银行" readonly />
                <el-button type="primary" @click="openBankDialog">选择开户行</el-button>
              </div>
            </el-form-item>

            <el-form-item label="金额" prop="amount" class="panel-form-item">
              <amount-input
                v-model="form.amount"
                :min="0"
                placeholder="请输入转账金额"
              />
            </el-form-item>
            </div>
          </section>

          <section class="panel-section">
            <div class="panel-form">
            <el-form-item label="付款人" prop="payerId" class="panel-form-item">
              <el-select
                v-model="form.payerId"
                placeholder="请选择付款人"
                :loading="payerLoading"
                @change="handlePayerChange"
              >
                <el-option
                  v-for="payer in payerOptions"
                  :key="payer.id"
                  :label="payer.name"
                  :value="payer.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="付款账号" prop="payerAccountNo" class="panel-form-item">
              <el-autocomplete
                ref="payerAccountAutocomplete"
                v-model="payerAccountKeyword"
                :fetch-suggestions="queryPayerAccount"
                trigger-on-focus
                :debounce="250"
                :placeholder="payerAccountPlaceholder"
                @focus="handlePayerAccountFocus"
                @blur="handlePayerAccountBlur"
                @input="handlePayerAccountInput"
                @select="handlePayerAccountPick"
              >
                <template slot-scope="{ item }">
                  <div class="recipient-option">
                    <div class="recipient-option-main">{{ item.accountNo }}</div>
                    <div class="recipient-option-meta">
                      <span>{{ item.payerName }}</span>
                      <span>{{ item.bankName }}</span>
                    </div>
                  </div>
                </template>
              </el-autocomplete>
            </el-form-item>

            <el-form-item label="付款银行" class="panel-form-item">
              <el-input :value="selectedAccountBankName" placeholder="选择付款账号后自动填充" readonly />
            </el-form-item>

            <el-form-item
              label="用途"
              prop="purpose"
              class="panel-form-item"
              :class="{ 'is-purpose-composite': showPrivatePurposeDetail }"
            >
              <div class="purpose-field-group">
                <template v-if="form.payeeType === 'yes'">
                  <div v-if="isCmbBank" class="purpose-select-group">
                    <el-select
                      v-model="form.purpose"
                      filterable
                      clearable
                      placeholder="请选择用途"
                    >
                      <el-option
                        v-for="item in cmbPurposeOptions"
                        :key="item"
                        :label="item"
                        :value="item"
                      />
                    </el-select>
                  </div>
                  <div v-else class="purpose-public-group">
                    <el-input
                      v-model="form.purpose"
                      placeholder="点击选择或输入对公用途"
                      clearable
                      @focus="openPurposeDialog"
                    >
                      <el-button slot="append" icon="el-icon-more" @click="openPurposeDialog" />
                    </el-input>
                  </div>
                </template>
                <template v-else>
                  <el-select
                    v-model="form.purpose"
                    clearable
                    placeholder="请选择对私用途"
                  >
                    <el-option
                      v-for="item in privatePurposeOptions"
                      :key="item"
                      :label="item"
                      :value="item"
                    />
                  </el-select>
                  <el-form-item
                    v-if="showPrivatePurposeDetail"
                    prop="purposeDetail"
                    class="purpose-detail-item"
                  >
                    <el-input
                      v-model="form.purposeDetail"
                      placeholder="请输入具体用途"
                      clearable
                    />
                  </el-form-item>
                </template>
              </div>
            </el-form-item>
            </div>
          </section>
        </div>

        <section class="addons-section">
          <el-collapse v-model="activeNames">
            <el-collapse-item name="addons">
              <template slot="title">
                <span class="addon-collapse-title">增值服务</span>
              </template>
              <div class="addon-body">
                <div class="addon-row">
                  <div class="addon-main">
                  <el-form-item label="通知收款人" class="addon-form-item">
                    <el-radio-group v-model="form.notifyReceiver">
                      <el-radio label="yes">是</el-radio>
                      <el-radio label="no">否</el-radio>
                    </el-radio-group>
                  </el-form-item>
                  </div>
                  <div class="addon-extra" :class="{ 'is-active': form.notifyReceiver === 'yes' }">
                    <transition name="el-fade-in">
                      <div v-if="form.notifyReceiver === 'yes'" class="addon-extra-form">
                      <el-form-item label="手机号码" prop="notifyPhone" class="addon-form-item addon-extra-field">
                        <el-input
                          v-model="form.notifyPhone"
                          placeholder="请输入收款人手机号"
                        />
                      </el-form-item>
                      </div>
                    </transition>
                  </div>
                </div>
                <div class="addon-row">
                  <div class="addon-main">
                  <el-form-item label="预约付款" class="addon-form-item">
                    <el-radio-group v-model="form.isScheduled">
                      <el-radio label="yes">是</el-radio>
                      <el-radio label="no">否</el-radio>
                    </el-radio-group>
                  </el-form-item>
                  </div>
                  <div class="addon-extra" :class="{ 'is-active': form.isScheduled === 'yes' }">
                    <transition name="el-fade-in">
                      <div v-if="form.isScheduled === 'yes'" class="addon-extra-form">
                      <el-form-item label="预约时间" prop="scheduleTime" class="addon-form-item addon-extra-field">
                        <el-date-picker
                          v-model="form.scheduleTime"
                          type="datetime"
                          placeholder="请选择预约时间"
                          format="yyyy-MM-dd HH:mm"
                          value-format="yyyy-MM-dd HH:mm:ss"
                          :picker-options="schedulePickerOptions"
                        />
                      </el-form-item>
                      </div>
                    </transition>
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </section>

        <section class="addons-section payee-type-section">
          <el-collapse v-model="activeNames">
            <el-collapse-item name="payeeType">
              <template slot="title">
                <span class="addon-collapse-title">其他信息</span>
              </template>
              <div class="addon-body">
                <div class="addon-row payee-type-row">
                  <div class="addon-main">
                  <el-form-item label="是否对公" class="addon-form-item">
                    <el-radio-group v-model="form.payeeType">
                      <el-radio label="yes">是</el-radio>
                      <el-radio label="no">否</el-radio>
                    </el-radio-group>
                  </el-form-item>
                  </div>
                  <div class="addon-extra payee-type-hint">
                    <span>{{ form.payeeType === 'yes' ? '当前按对公收款人校验与展示。' : '当前按对私收款人校验与展示。' }}</span>
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </section>
      </el-form>

    </section>

    <div class="page-button-area">
      <div class="page-button-row">
        <el-button size="medium" @click="handleReset">重置</el-button>
        <el-button ref="submitButton" type="primary" size="medium" @click="handleSubmit">提交转账</el-button>
      </div>
    </div>

    <section class="summary-panel">
      <h3>当前填写</h3>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-label">是否对公</span>
          <span class="summary-value">{{ form.payeeType === 'yes' ? '是' : '否' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">收款人</span>
          <span class="summary-value">{{ form.payeeName || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">收款账号</span>
          <span class="summary-value">{{ form.payeeAccount || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">收款银行</span>
          <span class="summary-value">{{ form.payeeBankName || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">快捷单据</span>
          <span class="summary-value">{{ selectedQuickDocumentLabel || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">金额</span>
          <span class="summary-value">{{ formatSummaryAmount }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">付款人</span>
          <span class="summary-value">{{ selectedPayerName || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">付款账号</span>
          <span class="summary-value">{{ form.payerAccountNo || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">付款银行</span>
          <span class="summary-value">{{ selectedAccountBankName || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">用途</span>
          <span class="summary-value">{{ displayPurpose || '-' }}</span>
        </div>
      </div>
    </section>
    <el-dialog
      title="选择开户行"
      :visible.sync="bankDialogVisible"
      width="900px"
      top="4vh"
      custom-class="bank-dialog"
      :close-on-click-modal="false"
      @opened="handleBankDialogOpened"
      @closed="handleBankDialogClosed"
    >
      <div ref="bankDialogContent" class="bank-dialog-content">
        <div ref="bankSearchPanel" class="bank-search-panel">
          <el-input
            v-model="bankKeyword"
            placeholder="请输入银行名称 / 支行名称 / 行号"
            clearable
            class="bank-search"
            @input="handleBankSearch"
          />
        </div>

        <el-table
          ref="bankTable"
          v-loading="bankListLoading"
          :data="bankOptions"
          :row-class-name="getBankRowClassName"
          highlight-current-row
          @row-click="handleBankRowClick"
          @row-dblclick="selectBank"
          :height="bankTableHeight"
          empty-text="暂无匹配结果，可按银行名称继续搜索"
        >
          <el-table-column label="选择" width="72" align="center">
            <template slot-scope="{ row }">
              <span class="bank-row-indicator" :class="{ 'is-active': isBankSelected(row) }"></span>
            </template>
          </el-table-column>
          <el-table-column prop="bankName" label="银行名称" min-width="140" />
          <el-table-column prop="branchName" label="支行名称" min-width="260" />
          <el-table-column prop="bankCode" label="行号" width="160" />
        </el-table>

        <div ref="bankDialogFooter" class="bank-dialog-footer">
          <div class="bank-selected-info" v-if="bankTempSelected">
            <span class="bank-selected-label">当前已选</span>
            <span class="bank-selected-value">{{ bankTempSelected.bankName }} {{ bankTempSelected.branchName }}</span>
          </div>
          <div class="bank-selected-info is-placeholder" v-else>请选择一项开户行后确认</div>

          <el-pagination
            :current-page="bankPage"
            :page-size="bankPageSize"
            :total="bankTotal"
            layout="total, prev, pager, next"
            background
            @current-change="handleBankPageChange"
          />
        </div>
      </div>
      <span slot="footer" class="bank-dialog-actions">
        <el-button @click="bankDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBank">确认选择</el-button>
      </span>
    </el-dialog>
    <el-dialog
      title="选择用途"
      :visible.sync="purposeDialogVisible"
      width="760px"
      top="8vh"
      custom-class="purpose-dialog"
      :close-on-click-modal="false"
      @closed="handlePurposeDialogClosed"
    >
      <div class="purpose-dialog-content">
        <el-tabs v-model="purposeActiveTab" class="purpose-tabs">
          <el-tab-pane
            v-for="group in publicPurposeGroups"
            :key="group.key"
            :label="group.label"
            :name="group.key"
          >
            <div class="purpose-tab-panel">
              <div class="purpose-chip-grid">
                <button
                  v-for="item in group.options"
                  :key="item"
                  type="button"
                  class="purpose-chip"
                  :class="{ 'is-active': purposeDraftValue === item }"
                  @click="selectPurposeOption(item)"
                >
                  {{ item }}
                </button>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <span slot="footer" class="bank-dialog-actions">
        <el-button @click="purposeDialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>
    <el-dialog
      title="快捷单据"
      :visible.sync="quickDocumentDialogVisible"
      width="960px"
      top="4vh"
      custom-class="bank-dialog quick-document-dialog"
      :close-on-click-modal="false"
      @opened="handleQuickDocumentDialogOpened"
      @closed="handleQuickDocumentDialogClosed"
    >
      <div class="bank-dialog-content">
        <div ref="quickDocumentSearchPanel" class="bank-search-panel">
          <el-input
            v-model="quickDocumentKeyword"
            placeholder="请输入单据编号 / 标题 / 收款人 / 收款账号"
            clearable
            class="bank-search"
            @input="handleQuickDocumentSearch"
          />
        </div>

        <el-table
          ref="quickDocumentTable"
          v-loading="quickDocumentListLoading"
          :data="quickDocumentOptions"
          :row-class-name="getQuickDocumentRowClassName"
          highlight-current-row
          :height="quickDocumentTableHeight"
          empty-text="暂无快捷单据，可调整关键字继续搜索"
          @row-click="handleQuickDocumentRowClick"
          @row-dblclick="selectQuickDocument"
        >
          <el-table-column label="选择" width="72" align="center">
            <template slot-scope="{ row }">
              <span class="bank-row-indicator" :class="{ 'is-active': isQuickDocumentSelected(row) }"></span>
            </template>
          </el-table-column>
          <el-table-column prop="documentNo" label="单据编号" width="154" />
          <el-table-column prop="documentTitle" label="单据标题" min-width="190" />
          <el-table-column prop="payerName" label="付款人" min-width="180" show-overflow-tooltip />
          <el-table-column prop="payerAccountNo" label="付款账号" width="170" />
          <el-table-column prop="payeeName" label="收款人" min-width="150" show-overflow-tooltip />
          <el-table-column prop="payeeAccount" label="收款账号" width="170" />
          <el-table-column prop="bankDisplayName" label="收款银行" min-width="220" show-overflow-tooltip />
          <el-table-column prop="amount" label="金额" width="120">
            <template slot-scope="{ row }">
              ¥{{ Number(row.amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
            </template>
          </el-table-column>
          <el-table-column label="收款类型" width="96">
            <template slot-scope="{ row }">
              {{ row.payeeType === 'yes' ? '对公' : '对私' }}
            </template>
          </el-table-column>
          <el-table-column prop="purpose" label="用途" width="120" />
        </el-table>

        <div ref="quickDocumentDialogFooter" class="bank-dialog-footer">
          <div class="bank-selected-info" v-if="quickDocumentTempSelected">
            <span class="bank-selected-label">当前已选</span>
            <span class="bank-selected-value">
              {{ quickDocumentTempSelected.documentNo }} / {{ quickDocumentTempSelected.payeeName }}
            </span>
          </div>
          <div class="bank-selected-info is-placeholder" v-else>请选择一条快捷单据后确认</div>

          <el-pagination
            :current-page="quickDocumentPage"
            :page-size="quickDocumentPageSize"
            :total="quickDocumentTotal"
            layout="total, prev, pager, next"
            background
            @current-change="handleQuickDocumentPageChange"
          />
        </div>
      </div>
      <span slot="footer" class="bank-dialog-actions">
        <el-button @click="quickDocumentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmQuickDocument">选择单据</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  fetchBankBranchByCode,
  fetchBankBranches,
  fetchPayerAccounts,
  fetchPayers,
  fetchQuickDocumentById,
  fetchQuickDocuments,
  searchPayerAccounts,
  searchRecipientRoster,
} from '../mock/transferService'
import {
  buildTrackedSubmissionPayload,
  notifyTrackedFormSubmitted
} from '../utils/agentTimingBridge'

export default {
  name: 'TransferForm',
  data() {
    return {
      payerOptions: [],
      payerAccounts: [],
      payerSetByAccountPick: false,
      bankOptions: [],
      bankTotal: 0,
      bankDialogVisible: false,
      bankKeyword: '',
      bankPage: 1,
      bankPageSize: 10,
      bankTableHeight: 560,
      bankTempSelected: null,
      bankListLoading: false,
      quickDocumentOptions: [],
      quickDocumentTotal: 0,
      quickDocumentDialogVisible: false,
      quickDocumentKeyword: '',
      quickDocumentPage: 1,
      quickDocumentPageSize: 8,
      quickDocumentTableHeight: 560,
      quickDocumentTempSelected: null,
      quickDocumentListLoading: false,
      selectedQuickDocumentId: '',
      selectedQuickDocumentLabel: '',
      quickDocumentApplying: false,
      payerLoading: false,
      accountLoading: false,
      payerAccountsRequestId: 0,
      payerAccountSuggestionRequestId: 0,
      payerAccountKeyword: '',
      payerAccountInputActive: false,
      showAllPayerAccountsOnFocus: false,
      payerAccountFocusSnapshot: '',
      activeNames: [],
      purposeDialogVisible: false,
      purposeActiveTab: 'business',
      purposeDraftValue: '',
      cmbPurposeOptions: [
        '货款',
        '服务费',
        '劳务费',
        '材料费',
        '备用金',
        '保证金',
        '咨询费'
      ],
      privatePurposeOptions: [
        '生活费',
        '还款',
        '工资',
        '房租',
        '医疗费',
        '教育支出',
        '材料费',
        '其他'
      ],
      publicPurposeGroups: [
        {
          key: 'business',
          label: '经营类',
          options: ['货款', '采购款', '销售款', '服务费', '咨询费', '项目款']
        },
        {
          key: 'finance',
          label: '财务类',
          options: ['报销款', '备用金', '保证金', '退款', '借款', '还款']
        },
        {
          key: 'hr',
          label: '人事类',
          options: ['工资', '奖金', '劳务费', '补贴', '福利费', '差旅费']
        }
      ],
      rules: {
        payeeName: [
          { required: true, message: '请输入收款人姓名', trigger: 'change' }
        ],
        payeeAccount: [
          { required: true, message: '请输入收款人账号', trigger: 'change' }
        ],
        payeeBankName: [
          { required: true, message: '请选择收款银行', trigger: 'change' }
        ],
        amount: [
          { required: true, message: '请输入转账金额', trigger: 'blur' }
        ],
        payerId: [
          { required: true, message: '请选择付款人', trigger: 'change' }
        ],
        payerAccountNo: [
          { required: true, message: '请输入付款账号', trigger: 'change' }
        ],
        purpose: [
          { validator: (rule, value, callback) => this.validatePurpose(rule, value, callback), trigger: 'change' },
          { validator: (rule, value, callback) => this.validatePurpose(rule, value, callback), trigger: 'blur' }
        ],
        purposeDetail: [
          { validator: (rule, value, callback) => this.validatePurposeDetail(rule, value, callback), trigger: 'change' },
          { validator: (rule, value, callback) => this.validatePurposeDetail(rule, value, callback), trigger: 'blur' }
        ],
        notifyPhone: [
          { required: true, message: '请输入收款人手机号', trigger: 'blur' }
        ],
        scheduleTime: [
          { required: true, message: '请选择预约时间', trigger: 'change' }
        ]
      },
      form: {
        payeeType: 'no',
        payeeName: '',
        payeeAccount: '',
        payeeBankName: '',
        payeeBankCode: '',
        payerId: '',
        payerAccountNo: '',
        amount: '',
        purpose: '',
        purposeDetail: '',
        notifyReceiver: 'no',
        notifyPhone: '',
        isScheduled: 'no',
        scheduleTime: ''
      }
    }
  },
  computed: {
    selectedPayerName() {
      const payer = this.payerOptions.find(item => item.id === this.form.payerId)
      return payer ? payer.name : ''
    },
    selectedAccount() {
      return this.payerAccounts.find(item => item.accountNo === this.form.payerAccountNo) || null
    },
    selectedAccountBankName() {
      return this.selectedAccount ? this.selectedAccount.bankName : ''
    },
    isCmbBank() {
      return this.selectedAccountBankName.includes('招商银行')
    },
    showPrivatePurposeDetail() {
      return this.form.payeeType === 'no' && this.form.purpose === '其他'
    },
    displayPurpose() {
      if (this.showPrivatePurposeDetail && this.form.purposeDetail) {
        return `${this.form.purpose}-${this.form.purposeDetail}`
      }
      return this.form.purpose
    },
    payerAccountPlaceholder() {
      if (this.payerAccountInputActive && this.form.payerAccountNo) {
        return this.form.payerAccountNo
      }
      return '请输入付款账号，至少3位开始匹配'
    },
    formatSummaryAmount() {
      if (this.form.amount === '' || this.form.amount === null || this.form.amount === undefined) return '-'
      const num = Number(this.form.amount)
      if (isNaN(num)) return '-'
      return '¥' + num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    schedulePickerOptions() {
      const nowPlusTen = new Date(Date.now() + 10 * 60 * 1000)
      const hh = String(nowPlusTen.getHours()).padStart(2, '0')
      const mm = String(nowPlusTen.getMinutes()).padStart(2, '0')
      const ss = String(nowPlusTen.getSeconds()).padStart(2, '0')
      return {
        disabledDate(time) {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const selected = new Date(time)
          selected.setHours(0, 0, 0, 0)
          return selected.getTime() < today.getTime()
        },
        selectableRange: `${hh}:${mm}:${ss} - 23:59:59`
      }
    }
  },
  created() {
    this.initializeMocks()
  },
  watch: {
    'form.payeeType'(next, prev) {
      if (this.quickDocumentApplying) return
      if (next !== prev) {
        this.resetPurposeFields()
      }
    },
    selectedAccountBankName(next, prev) {
      if (this.quickDocumentApplying) return
      if (next !== prev) {
        this.resetPurposeFields()
      }
    },
    'form.purpose'(next) {
      if (next !== '其他' && this.form.purposeDetail) {
        this.form.purposeDetail = ''
        this.clearPurposeValidate()
      }
    }
  },
  mounted() {
  //   window.startAgentTiming({
  //   attachmentName: 'invoice-001.pdf',
  //   prompt: '请从附件中提取转账信息并填入页面表单'
  // })
    window.addEventListener('resize', this.updateBankTableHeight)
    window.addEventListener('resize', this.updateQuickDocumentTableHeight)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateBankTableHeight)
    window.removeEventListener('resize', this.updateQuickDocumentTableHeight)
  },
  methods: {
    resetPurposeFields() {
      this.form.purpose = ''
      this.form.purposeDetail = ''
      this.purposeDraftValue = ''
      this.purposeDialogVisible = false
      this.clearPurposeValidate()
    },
    clearPurposeValidate() {
      this.$nextTick(() => {
        if (!this.$refs.transferForm) return
        this.$refs.transferForm.clearValidate(['purpose', 'purposeDetail'])
      })
    },
    validatePurpose(rule, value, callback) {
      if (!value) {
        callback(new Error('请选择或输入用途'))
        return
      }
      if (this.form.payeeType === 'yes' && this.isCmbBank && !this.cmbPurposeOptions.includes(value)) {
        callback(new Error('招商银行对公用途需选择预置值'))
        return
      }
      callback()
    },
    validatePurposeDetail(rule, value, callback) {
      if (this.showPrivatePurposeDetail && !value) {
        callback(new Error('请输入具体用途'))
        return
      }
      callback()
    },
    openPurposeDialog() {
      if (this.form.payeeType !== 'yes' || this.isCmbBank) return
      this.purposeDraftValue = this.form.purpose
      this.purposeDialogVisible = true
    },
    selectPurposeOption(value) {
      this.purposeDraftValue = value
      this.form.purpose = value
      this.purposeDialogVisible = false
      this.clearPurposeValidate()
    },
    handlePurposeDialogClosed() {
      this.purposeDraftValue = this.form.purpose
    },
    syncPayerAccountInputValue() {
      this.payerAccountKeyword = this.payerAccountInputActive ? '' : this.form.payerAccountNo
    },
    activatePayerAccountSuggestionsIfFocused() {
      const autocomplete = this.$refs.payerAccountAutocomplete
      if (!autocomplete || typeof autocomplete.getInput !== 'function') return

      const input = autocomplete.getInput()
      if (input && document.activeElement === input) {
        autocomplete.activated = true
      }
    },
    invalidatePayerAccountSuggestions() {
      this.payerAccountSuggestionRequestId += 1
    },
    async buildCurrentPayerAccountSuggestions(payerId) {
      if (!payerId) return []
      return fetchPayerAccounts(payerId)
    },
    pickDefaultPayerAccount(accounts) {
      return (accounts || []).find(account => account.reverse3) || null
    },
    async syncPayerAccounts(payerId) {
      const requestId = ++this.payerAccountsRequestId

      if (!payerId) {
        this.payerAccounts = []
        return []
      }

      this.accountLoading = true
      try {
        const accounts = await fetchPayerAccounts(payerId)
        if (requestId !== this.payerAccountsRequestId || this.form.payerId !== payerId) {
          return this.payerAccounts
        }
        this.payerAccounts = accounts
        return accounts
      } finally {
        if (requestId === this.payerAccountsRequestId) {
          this.accountLoading = false
        }
      }
    },
    async initializeMocks() {
      this.payerLoading = true
      try {
        this.payerOptions = await fetchPayers()
        // 默认选中第一个付款人，仅在配置了默认账号时自动带出
        if (this.payerOptions.length > 0) {
          const firstPayer = this.payerOptions[0]
          this.form.payerId = firstPayer.id
          const accounts = await fetchPayerAccounts(firstPayer.id)
          this.payerAccounts = accounts
          const defaultAccount = this.pickDefaultPayerAccount(accounts)
          if (defaultAccount) {
            this.form.payerAccountNo = defaultAccount.accountNo
          }
          this.syncPayerAccountInputValue()
        }
      } finally {
        this.payerLoading = false
      }
    },
    async handlePayerChange() {
      // 如果是 handlePayerAccountPick 内部设置的 payerId，跳过联动清空逻辑
      if (this.payerSetByAccountPick) {
        this.payerSetByAccountPick = false
        return
      }
      this.payerAccountsRequestId += 1
      this.invalidatePayerAccountSuggestions()
      this.payerAccountFocusSnapshot = ''
      this.showAllPayerAccountsOnFocus = false
      this.payerAccounts = []
      if (!this.form.payerId) return

      const accounts = await this.syncPayerAccounts(this.form.payerId)
      // 仅在配置了默认账号时自动选中
      const defaultAccount = this.pickDefaultPayerAccount(accounts)
      if (defaultAccount) {
        this.form.payerAccountNo = defaultAccount.accountNo
        this.payerAccountKeyword = defaultAccount.accountNo
      }
    },
    async queryPayerAccount(queryString, cb) {
      const requestId = ++this.payerAccountSuggestionRequestId
      const query = (queryString || '').trim()
      const payerId = this.form.payerId

      if (
        this.showAllPayerAccountsOnFocus &&
        query === this.payerAccountFocusSnapshot &&
        query === this.form.payerAccountNo
      ) {
        this.showAllPayerAccountsOnFocus = false
        if (!payerId) {
          cb([])
          return
        }
        const result = await this.buildCurrentPayerAccountSuggestions(payerId)
        if (requestId !== this.payerAccountSuggestionRequestId || this.form.payerId !== payerId) {
          return
        }
        cb(result)
        return
      }
      this.showAllPayerAccountsOnFocus = false

      if (query.length < 1) {
        // 不输入时：只展示当前付款人的账号
        if (!payerId) {
          cb([])
          return
        }
        const result = await this.buildCurrentPayerAccountSuggestions(payerId)
        if (requestId !== this.payerAccountSuggestionRequestId || this.form.payerId !== payerId) {
          return
        }
        cb(result)
        return
      }

      // 输入了1位以上：搜索所有付款账号
      const options = await searchPayerAccounts(query)
      if (
        requestId !== this.payerAccountSuggestionRequestId ||
        (this.payerAccountKeyword || '').trim() !== query
      ) {
        return
      }
      cb(options)
    },
    handlePayerAccountFocus() {
      this.payerAccountInputActive = true
      this.showAllPayerAccountsOnFocus = true
      this.payerAccountFocusSnapshot = this.form.payerAccountNo
      this.syncPayerAccountInputValue()
      this.$nextTick(() => {
        this.activatePayerAccountSuggestionsIfFocused()
      })
    },
    handlePayerAccountBlur() {
      this.payerAccountInputActive = false
      this.showAllPayerAccountsOnFocus = false
      this.syncPayerAccountInputValue()
    },
    handlePayerAccountInput() {
      this.invalidatePayerAccountSuggestions()
      if (this.payerAccountKeyword !== this.payerAccountFocusSnapshot) {
        this.showAllPayerAccountsOnFocus = false
      }
      this.activatePayerAccountSuggestionsIfFocused()
      return this.payerAccountKeyword
    },
    async handlePayerAccountPick(account) {
      if (!account) return

      this.invalidatePayerAccountSuggestions()
      this.showAllPayerAccountsOnFocus = false
      this.payerAccountFocusSnapshot = account.accountNo
      this.payerAccounts = [
        {
          accountNo: account.accountNo,
          bankName: account.bankName,
          bankCode: account.bankCode
        }
      ]
      this.form.payerAccountNo = account.accountNo
      this.syncPayerAccountInputValue()
      // @change 事件由内部 watch 同步触发，先让 handlePayerChange 执行完（它会因为 payerId 没变而 return），
      // 再用 $nextTick 把 payerId 改成目标值，这样 el-select 就不会再触发 @change 了
      this.$nextTick(() => {
        this.payerSetByAccountPick = true
        this.form.payerId = account.payerId
        this.$nextTick(() => {
          this.payerSetByAccountPick = false
        })
      })
    },
    async loadRecipientSuggestions(queryString, cb) {
      const normalizedQuery = (queryString || '').trim()

      if (!this.form.payerId || normalizedQuery.length < 3) {
        cb([])
        return
      }

      const options = await searchRecipientRoster({
        payerId: this.form.payerId,
        query: normalizedQuery
      })

      cb(options)
    },
    queryPayeeByName(queryString, cb) {
      this.loadRecipientSuggestions(queryString, cb)
    },
    queryPayeeByAccount(queryString, cb) {
      this.loadRecipientSuggestions(queryString, cb)
    },
    handleRecipientPick(recipient) {
      if (!recipient) return

      this.form.payeeName = recipient.payeeName
      this.form.payeeAccount = recipient.payeeAccount
      this.form.payeeBankName = recipient.bankDisplayName
      this.form.payeeBankCode = recipient.bankCode
      this.syncPayeeTypeByName(recipient.payeeName)
    },
    handlePayeeFieldInput() {
      this.syncPayeeTypeByName(this.form.payeeName)
      if (this.form.payeeBankCode && !this.form.payeeBankName) {
        this.form.payeeBankCode = ''
      }
      if (!this.form.payeeName && !this.form.payeeAccount) {
        this.clearQuickDocumentSelection()
      }
    },
    syncPayeeTypeByName(payeeName) {
      const normalizedName = (payeeName || '').trim()
      this.form.payeeType = normalizedName.length > 3 ? 'yes' : 'no'
    },
    handlePayeeClear() {
      // no linkage needed on payee clear
    },
    clearQuickDocumentSelection() {
      this.selectedQuickDocumentId = ''
      this.selectedQuickDocumentLabel = ''
    },
    handleSubmit() {
      return new Promise((resolve) => {
        this.$refs.transferForm.validate((valid) => {
          if (!valid) {
            resolve(false)
            return
          }

          const { payeeName, payeeAccount, payeeBankName, payeeBankCode, amount,
              payerId, payerAccountNo,
              notifyReceiver, notifyPhone,
              isScheduled, scheduleTime } = this.form

        const purpose = this.displayPurpose

        const data = {
          payeeName,
          payeeAccount,
          payeeBankName,
          payeeBankCode,
          amount,
          payerId,
          payerAccountNo,
          purpose,
          quickDocumentId: this.selectedQuickDocumentId || undefined
        }

        if (notifyReceiver === 'yes') {
          data.notifyPhone = notifyPhone
        }

        if (isScheduled === 'yes') {
          data.scheduleTime = scheduleTime
        }

          const trackedPayload = buildTrackedSubmissionPayload(data)

          console.log('提交数据：', trackedPayload)
          notifyTrackedFormSubmitted(trackedPayload)
          resolve(true)
        })
      })
    },
    handleReset() {
      this.$refs.transferForm.resetFields()
      // 重置后重新默认选中第一个付款人，仅带出明确配置的默认账号
      this.$nextTick(async () => {
        if (this.payerOptions.length > 0) {
          const firstPayer = this.payerOptions[0]
          this.form.payerId = firstPayer.id
          const accounts = await fetchPayerAccounts(firstPayer.id)
          this.payerAccounts = accounts
          const defaultAccount = this.pickDefaultPayerAccount(accounts)
          if (defaultAccount) {
            this.form.payerAccountNo = defaultAccount.accountNo
          }
          this.syncPayerAccountInputValue()
        }
        this.activeNames = ['addons']
        this.resetPurposeFields()
        this.clearQuickDocumentSelection()
      })
    },
    async openBankDialog() {
      this.bankTempSelected = this.form.payeeBankCode
        ? await fetchBankBranchByCode(this.form.payeeBankCode)
        : null
      this.bankPage = 1
      this.bankDialogVisible = true
      this.loadBankOptions()
    },
    handleBankDialogOpened() {
      this.$nextTick(() => {
        this.updateBankTableHeight()
        if (this.$refs.bankTable && typeof this.$refs.bankTable.doLayout === 'function') {
          this.$refs.bankTable.doLayout()
        }
      })
    },
    handleBankPageChange(page) {
      this.bankPage = page
      this.loadBankOptions()
    },
    handleBankSearch() {
      this.bankPage = 1
      this.loadBankOptions()
    },
    handleBankRowClick(row) {
      this.bankTempSelected = row
    },
    getBankRowClassName({ row }) {
      return this.isBankSelected(row) ? 'is-bank-selected' : ''
    },
    isBankSelected(row) {
      return Boolean(
        row &&
        this.bankTempSelected &&
        row.bankCode === this.bankTempSelected.bankCode
      )
    },
    async loadBankOptions() {
      this.bankListLoading = true
      try {
        const response = await fetchBankBranches({
          keyword: this.bankKeyword.replace(/\s+/g, ''),
          page: this.bankPage,
          pageSize: this.bankPageSize
        })
        this.bankOptions = response.list
        this.bankTotal = response.total
        this.$nextTick(() => {
          this.updateBankTableHeight()
          if (!this.$refs.bankTable) return
          const matched = this.bankOptions.find(item => this.isBankSelected(item))
          this.$refs.bankTable.doLayout()
          this.$refs.bankTable.setCurrentRow(matched || null)
        })
      } finally {
        this.bankListLoading = false
      }
    },
    applySelectedBank(row) {
      this.bankTempSelected = row
      this.form.payeeBankName = `${row.bankName} ${row.branchName}`
      this.form.payeeBankCode = row.bankCode
    },
    selectBank(row) {
      this.applySelectedBank(row)
      this.bankDialogVisible = false
    },
    confirmBank() {
      if (!this.bankTempSelected) {
        this.$message.warning('请先选择一项开户行')
        return
      }
      this.applySelectedBank(this.bankTempSelected)
      this.bankDialogVisible = false
    },
    handleBankDialogClosed() {
      this.bankTempSelected = null
    },
    async openQuickDocumentDialog() {
      this.quickDocumentTempSelected = this.selectedQuickDocumentId
        ? await fetchQuickDocumentById(this.selectedQuickDocumentId)
        : null
      this.quickDocumentPage = 1
      this.quickDocumentDialogVisible = true
      this.loadQuickDocumentOptions()
    },
    handleQuickDocumentDialogOpened() {
      this.$nextTick(() => {
        this.updateQuickDocumentTableHeight()
        if (this.$refs.quickDocumentTable && typeof this.$refs.quickDocumentTable.doLayout === 'function') {
          this.$refs.quickDocumentTable.doLayout()
        }
      })
    },
    handleQuickDocumentDialogClosed() {
      this.quickDocumentTempSelected = null
    },
    handleQuickDocumentSearch() {
      this.quickDocumentPage = 1
      this.loadQuickDocumentOptions()
    },
    handleQuickDocumentPageChange(page) {
      this.quickDocumentPage = page
      this.loadQuickDocumentOptions()
    },
    handleQuickDocumentRowClick(row) {
      this.quickDocumentTempSelected = row
    },
    getQuickDocumentRowClassName({ row }) {
      return this.isQuickDocumentSelected(row) ? 'is-bank-selected' : ''
    },
    isQuickDocumentSelected(row) {
      return Boolean(
        row &&
        this.quickDocumentTempSelected &&
        row.id === this.quickDocumentTempSelected.id
      )
    },
    async loadQuickDocumentOptions() {
      this.quickDocumentListLoading = true
      try {
        const response = await fetchQuickDocuments({
          keyword: this.quickDocumentKeyword.replace(/\s+/g, ''),
          page: this.quickDocumentPage,
          pageSize: this.quickDocumentPageSize
        })
        this.quickDocumentOptions = response.list
        this.quickDocumentTotal = response.total
        this.$nextTick(() => {
          this.updateQuickDocumentTableHeight()
          if (!this.$refs.quickDocumentTable) return
          const matched = this.quickDocumentOptions.find(item => this.isQuickDocumentSelected(item))
          this.$refs.quickDocumentTable.doLayout()
          this.$refs.quickDocumentTable.setCurrentRow(matched || null)
        })
      } finally {
        this.quickDocumentListLoading = false
      }
    },
    async applyQuickDocument(document) {
      this.quickDocumentApplying = true

      try {
        this.quickDocumentTempSelected = document
        this.selectedQuickDocumentId = document.id
        this.selectedQuickDocumentLabel = `${document.documentNo} ${document.documentTitle}`

        if (document.payerId) {
          this.form.payerId = document.payerId
          const accounts = await this.syncPayerAccounts(document.payerId)
          const matchedAccount = accounts.find(item => item.accountNo === document.payerAccountNo)
          if (matchedAccount) {
            this.form.payerAccountNo = matchedAccount.accountNo
            this.payerAccountKeyword = matchedAccount.accountNo
          }
        }

        this.form.payeeType = document.payeeType
        this.form.payeeName = document.payeeName
        this.form.payeeAccount = document.payeeAccount
        this.form.payeeBankName = document.bankDisplayName
        this.form.payeeBankCode = document.bankCode
        this.form.amount = document.amount
        this.form.purpose = document.purpose
        this.form.purposeDetail = document.purposeDetail || ''

        this.syncPayerAccountInputValue()
        this.clearPurposeValidate()
        this.$nextTick(() => {
          if (!this.$refs.transferForm) return
          this.$refs.transferForm.clearValidate(['payeeName', 'payeeAccount', 'payeeBankName', 'payerId', 'payerAccountNo', 'amount', 'purpose', 'purposeDetail'])
        })
      } finally {
        this.$nextTick(() => {
          this.quickDocumentApplying = false
        })
      }
    },
    async selectQuickDocument(row) {
      await this.applyQuickDocument(row)
      this.quickDocumentDialogVisible = false
    },
    async confirmQuickDocument() {
      if (!this.quickDocumentTempSelected) {
        this.$message.warning('请先选择一条快捷单据')
        return
      }
      await this.applyQuickDocument(this.quickDocumentTempSelected)
      this.quickDocumentDialogVisible = false
    },
    updateBankTableHeight() {
      if (!this.bankDialogVisible) return

      this.$nextTick(() => {
        const dialogBody = document.querySelector('.bank-dialog .el-dialog__body')
        const searchPanel = this.$refs.bankSearchPanel
        const footer = this.$refs.bankDialogFooter

        if (!dialogBody || !searchPanel || !footer) return

        const bodyHeight = dialogBody.clientHeight
        const searchHeight = searchPanel.offsetHeight
        const footerHeight = footer.offsetHeight
        const contentGap = 24
        const nextHeight = bodyHeight - searchHeight - footerHeight - contentGap

        this.bankTableHeight = Math.max(260, nextHeight)

        if (this.$refs.bankTable && typeof this.$refs.bankTable.doLayout === 'function') {
          this.$refs.bankTable.doLayout()
        }
      })
    },
    updateQuickDocumentTableHeight() {
      if (!this.quickDocumentDialogVisible) return

      this.$nextTick(() => {
        const dialogBody = document.querySelector('.quick-document-dialog .el-dialog__body')
        const searchPanel = this.$refs.quickDocumentSearchPanel
        const footer = this.$refs.quickDocumentDialogFooter

        if (!dialogBody || !searchPanel || !footer) return

        const bodyHeight = dialogBody.clientHeight
        const searchHeight = searchPanel.offsetHeight
        const footerHeight = footer.offsetHeight
        const contentGap = 24
        const nextHeight = bodyHeight - searchHeight - footerHeight - contentGap

        this.quickDocumentTableHeight = Math.max(260, nextHeight)

        if (this.$refs.quickDocumentTable && typeof this.$refs.quickDocumentTable.doLayout === 'function') {
          this.$refs.quickDocumentTable.doLayout()
        }
      })
    }
  }
}
</script>

<style scoped>
:deep(.el-collapse) {
  border: none;
}

:deep(.el-collapse-item__wrap) {
  border-bottom: none;
}

:deep(.el-radio) {
  margin-right: 20px;
}

:deep(.el-radio__label) {
  padding-left: 8px;
}

.transfer-page {
  min-height: 100vh;
  padding: 40px 24px;
  background: linear-gradient(180deg, #eef4ff 0%, #f7f9fc 100%);
}

.page-header {
  max-width: 1180px;
  margin: 0 auto 28px;
}

.page-kicker {
  margin: 0 0 8px;
  color: #ffa62f;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.6px;
}

.page-header h1 {
  margin: 0;
  font-size: 32px;
}

.main-card {
  max-width: 1180px;
  margin: 0 auto;
  padding: 24px;
  border: 1px solid #e6ebf5;
  border-radius: 24px;
  background: linear-gradient(180deg, #ffffff 0%, #fffdf9 100%);
  box-shadow: 0 20px 44px rgba(31, 42, 68, 0.06);
}

.page-button-area {
  position: sticky;
  bottom: 0;
  z-index: 10;
  max-width: 1180px;
  margin: 24px auto 0;
}

.page-button-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid #e6ebf5;
  border-radius: 18px;
  box-shadow: 0 -8px 24px rgba(31, 42, 68, 0.08);
}

.form-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.form-strip-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  padding: 18px 20px;
  border-radius: 0;
  background: linear-gradient(90deg, #ffe2b3 0%, #ffffff 100%);
}

.form-strip-title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  color: #ffffff;
  text-shadow: 0 1px 0 rgba(148, 79, 7, 0.18);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.panel-section {
  min-width: 0;
}

.panel-form {
  margin-top: 4px;
}

.panel-form-item {
  margin-bottom: 18px;
}

.panel-form-item:last-child {
  margin-bottom: 0;
}

.panel-form-item :deep(.el-form-item__label) {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.panel-form-item :deep(.el-form-item__content) {
  display: flex;
  align-items: center;
  min-width: 0;
}

.panel-form-item :deep(.el-select),
.panel-form-item :deep(.el-input),
.panel-form-item :deep(.el-autocomplete),
.panel-form-item :deep(.el-autocomplete .el-input),
.panel-form-item :deep(.el-date-editor.el-input),
.panel-form-item :deep(.el-date-editor.el-input__inner) {
  width: 100%;
}

.bank-picker {
  display: flex;
  flex: 1;
  flex-wrap: nowrap;
  gap: 12px;
  align-items: center;
  min-width: 0;
}

.bank-picker :deep(.el-autocomplete),
.bank-picker :deep(.el-input) {
  flex: 1;
  min-width: 0;
}

.bank-picker :deep(.el-button) {
  flex-shrink: 0;
}

.purpose-field-group {
  display: flex;
  flex: 1;
  gap: 12px;
  align-items: flex-start;
  width: 100%;
  min-width: 0;
}

.purpose-field-group > .el-select {
  flex: 1 1 100%;
  min-width: 0;
}

.is-purpose-composite .purpose-field-group > .el-select {
  flex: 0 0 calc(38% - 6px);
}

.purpose-public-group,
.purpose-select-group {
  flex: 1;
  min-width: 0;
}

.purpose-detail-item {
  flex: 0 0 calc(62% - 6px);
  min-width: 0;
  margin-bottom: 0;
}

.purpose-dialog-content {
  min-height: 320px;
}

.purpose-tab-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-top: 8px;
}

.purpose-chip-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.purpose-chip {
  padding: 12px 14px;
  border: 1px solid #dde7f5;
  border-radius: 14px;
  background: #fff;
  color: #1f2a44;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.purpose-chip:hover {
  border-color: #ffbf69;
  color: #f08b1d;
  background: #fffaf2;
}

.purpose-chip.is-active {
  border-color: #ffa62f;
  background: #fff4e6;
  color: #d97706;
  box-shadow: 0 0 0 3px rgba(255, 166, 47, 0.14);
}

.bank-picker .el-input {
  flex: 1;
}

.bank-dialog-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.bank-search-panel {
  padding: 14px 16px;
  border: 1px solid #edf1f7;
  border-radius: 18px;
  background: #fbfcff;
}

.bank-search {
  margin-bottom: 0;
}

.bank-row-indicator {
  display: inline-flex;
  width: 12px;
  height: 12px;
  border: 2px solid #d0d8e6;
  border-radius: 50%;
  background: #fff;
  transition: all 0.2s ease;
}

.bank-row-indicator.is-active {
  border-color: #ffa62f;
  background: #ffa62f;
  box-shadow: 0 0 0 3px rgba(255, 166, 47, 0.18);
}

.bank-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 4px;
  padding: 18px 20px 0;
  border-top: 1px solid #edf1f7;
}

.bank-selected-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.bank-selected-label {
  font-size: 12px;
  color: #98a2b3;
}

.bank-selected-value {
  color: #f08b1d;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
}

.bank-selected-info.is-placeholder {
  display: block;
  color: #98a2b3;
  font-size: 13px;
}

.bank-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.recipient-option {
  padding: 4px 0;
}

.recipient-option-main {
  font-size: 14px;
  font-weight: 600;
  color: #1f2a44;
  line-height: 1.4;
}

.recipient-option-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  margin-top: 4px;
  font-size: 12px;
  color: #6b7890;
  line-height: 1.5;
}

/* 分页器主题色覆盖 */
.bank-dialog-footer .el-pagination .el-pager li {
  font-weight: normal;
}

.bank-dialog-footer .el-pagination .el-pager li:not(.disabled).active {
  background-color: #ffa62f !important;
  color: #fff;
}

.bank-dialog-footer .el-pagination .el-pager li:not(.disabled):hover {
  color: #ffa62f;
}

.bank-dialog-footer .el-pagination .btn-prev:hover,
.bank-dialog-footer .el-pagination .btn-next:hover {
  color: #ffa62f;
}


:deep(.bank-dialog) {
  --bank-dialog-height: min(820px, 92vh);
  width: 900px;
  max-width: calc(100vw - 32px);
  height: var(--bank-dialog-height);
  max-height: var(--bank-dialog-height);
  display: flex;
  flex-direction: column;
  border-radius: 24px;
  overflow: hidden;
}

:deep(.bank-dialog .el-dialog__header) {
  padding: 22px 24px 0;
}

:deep(.bank-dialog .el-dialog__title) {
  font-size: 18px;
  font-weight: 700;
  color: #1f2a44;
}

:deep(.bank-dialog .el-dialog__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px 24px 20px;
  overflow: hidden;
  min-height: 0;
  box-sizing: border-box;
}

:deep(.bank-dialog .el-dialog__footer) {
  padding: 0 24px 24px;
}

:deep(.bank-dialog .el-table__body tr.is-bank-selected > td),
:deep(.bank-dialog .el-table__body tr.current-row > td) {
  background-color: #fff4e6 !important;
}

:deep(.bank-dialog .el-table__body tr:hover > td) {
  background-color: #fffbf5 !important;
}

:deep(.bank-dialog .el-dialog__headerbtn:focus .el-dialog__close),
:deep(.bank-dialog .el-dialog__headerbtn:hover .el-dialog__close) {
  color: #ffa62f !important;
}

:deep(.bank-dialog .el-table th),
:deep(.bank-dialog .el-table .el-table__header-wrapper th) {
  background-color: #fffbf5 !important;
  color: #333;
}

:deep(.quick-document-dialog .el-table .cell) {
  word-break: break-word;
}

:deep(.purpose-dialog) {
  border-radius: 24px;
  overflow: hidden;
}

:deep(.purpose-dialog .el-dialog__header) {
  padding: 22px 24px 0;
}

:deep(.purpose-dialog .el-dialog__body) {
  padding: 12px 24px 20px;
}

:deep(.purpose-dialog .el-dialog__footer) {
  padding: 0 24px 24px;
}

:deep(.purpose-dialog .el-tabs__item.is-active) {
  color: #f08b1d;
}

:deep(.purpose-dialog .el-tabs__active-bar) {
  background-color: #ffa62f;
}

@media (max-width: 900px) {
  .main-card {
    padding: 18px;
  }

  .form-strip,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-strip {
    gap: 12px;
    padding: 14px 16px;
  }

  .bank-picker {
    flex-direction: column;
  }

  .purpose-field-group {
    flex-direction: column;
  }

  .purpose-chip-grid {
    grid-template-columns: 1fr 1fr;
  }

  .bank-dialog-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .page-button-area {
    margin: 16px 0 0;
  }

  .page-button-row {
    border-radius: 12px;
  }
}

.addons-section {
  margin-top: 24px;
}

.payee-type-section {
  margin-top: 16px;
}

.addons-section :deep(.el-collapse) {
  border: 1px solid #dde7f5;
  border-radius: 18px;
  overflow: hidden;
  background: linear-gradient(180deg, #fbfdff 0%, #f5f9ff 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.addon-collapse-title {
  font-size: 15px;
  font-weight: 700;
  color: #1f2a44;
  letter-spacing: 0.02em;
  position: relative;
  padding-left: 14px;
}

.addon-collapse-title::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  width: 6px;
  height: 16px;
  border-radius: 999px;
  background: linear-gradient(180deg, #ffb449 0%, #ff8b2c 100%);
  transform: translateY(-50%);
}

.addons-section :deep(.el-collapse-item__header) {
  height: auto;
  min-height: 64px;
  line-height: 1;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.82);
  border-bottom: 1px solid #e6edf8;
  backdrop-filter: blur(8px);
}

.addons-section :deep(.el-collapse-item__wrap) {
  background: transparent;
}

.addons-section :deep(.el-collapse-item__content) {
  padding: 24px;
}

.addon-body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.addon-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 24px;
  align-items: center;
  padding: 18px 20px;
  border: 1px solid #e3ebf6;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 8px 20px rgba(31, 42, 68, 0.04);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.addon-row:hover {
  border-color: #d3def0;
  box-shadow: 0 12px 24px rgba(31, 42, 68, 0.06);
  transform: translateY(-1px);
}

.addon-main {
  min-width: 0;
  display: flex;
  align-items: center;
}

.addon-form-item {
  width: 100%;
  margin-bottom: 0;
}

.addon-form-item :deep(.el-form-item__label) {
  display: inline-flex;
  align-items: center;
  height: 40px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2a44;
}

.addon-form-item :deep(.el-form-item__content) {
  display: flex;
  align-items: center;
  min-height: 40px;
  line-height: 1;
}

.addon-form-item :deep(.el-radio-group) {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
}

.addon-form-item :deep(.el-radio) {
  display: inline-flex;
  align-items: center;
  margin-right: 20px;
  line-height: 1;
}

.addon-form-item :deep(.el-radio__input) {
  display: inline-flex;
  align-items: center;
}

.addon-form-item :deep(.el-radio__inner) {
  display: block;
}

.addon-form-item :deep(.el-radio__label) {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
}

.addon-extra {
  width: 100%;
  min-height: 40px;
  display: flex;
  align-items: center;
}

.payee-type-row {
  align-items: center;
}

.payee-type-hint {
  display: flex;
  align-items: center;
  padding: 0 8px;
  font-size: 13px;
  color: #6b7890;
}

.addon-extra-form,
.addon-extra-field {
  width: 100%;
}

.addon-extra-field {
  margin-bottom: 0;
}

.addon-extra-field :deep(.el-form-item__label) {
  font-size: 13px;
  color: #6b7890;
}

.addon-extra-field :deep(.el-input),
.addon-extra-field :deep(.el-date-editor.el-input),
.addon-extra-field :deep(.el-date-editor.el-input__inner) {
  width: 100%;
}

.summary-panel {
  max-width: 1180px;
  margin: 24px auto 0;
  padding: 24px;
  border: 1px solid #e6ebf5;
  border-radius: 20px;
  background: #ffffff;
}

.summary-panel h3 {
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 12px;
  color: #999;
}

.summary-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

@media (max-width: 900px) {
  .addons-panel .el-collapse-item__content {
    padding: 18px;
  }

  .addon-body {
    grid-template-columns: 1fr;
  }

  .addon-row {
    grid-template-columns: 1fr;
    row-gap: 14px;
  }

  .addon-extra {
    flex-direction: column;
    align-items: stretch;
  }

  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
