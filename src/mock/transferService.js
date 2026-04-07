import {
  payerRecords,
  bankBranchRecords,
  recipientRosterRecords,
  quickDocumentRecords
} from './transferData'

function wait(ms = 180) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function enrichRecipient(recipient) {
  const branch = bankBranchRecords.find(item => item.bankCode === recipient.bankCode)

  return {
    ...recipient,
    bankName: branch ? branch.bankName : '',
    branchName: branch ? branch.branchName : '',
    bankDisplayName: branch ? `${branch.bankName} ${branch.branchName}` : ''
  }
}

export async function fetchPayers() {
  await wait()
  return payerRecords.map(({ id, name }) => ({ id, name }))
}

export async function fetchPayerAccounts(payerId) {
  await wait()
  const payer = payerRecords.find(item => item.id === payerId)
  if (!payer) return []
  return clone(payer.accounts).map(account => ({
    ...account,
    payerId: payer.id,
    payerName: payer.name
  }))
}

export async function searchPayerAccounts(query) {
  await wait(220)
  const normalizedQuery = (query || '').trim().toLowerCase()

  const matched = []

  payerRecords.forEach(payer => {
    payer.accounts.forEach(account => {
      const matchText = `${payer.name}${account.accountNo}${account.bankName}`.toLowerCase()

      if (!matchText.includes(normalizedQuery)) return

      matched.push({
        payerId: payer.id,
        payerName: payer.name,
        accountNo: account.accountNo,
        bankName: account.bankName,
        bankCode: account.bankCode,
        value: account.accountNo
      })
    })
  })

  return clone(matched)
}

export async function fetchBankBranches({ keyword = '', page = 1, pageSize = 10 } = {}) {
  await wait()
  const normalizedKeyword = keyword.trim()
  const filtered = normalizedKeyword
    ? bankBranchRecords.filter(item => {
        const text = `${item.bankName}${item.branchName}${item.bankCode}`.toLowerCase()
        return text.includes(normalizedKeyword.toLowerCase())
      })
    : bankBranchRecords

  const start = (page - 1) * pageSize
  return {
    list: clone(filtered.slice(start, start + pageSize)),
    total: filtered.length
  }
}

export async function fetchBankBranchByCode(bankCode) {
  await wait(120)
  const branch = bankBranchRecords.find(item => item.bankCode === bankCode)
  return branch ? clone(branch) : null
}

export async function lookupPayeeBank({ payeeName, payeeAccount }) {
  await wait(240)
  const name = (payeeName || '').trim()
  const account = (payeeAccount || '').trim()

  if (!name || !account) {
    throw new Error('请输入收款人和收款人账号后再查询')
  }

  const matchedRecipient = recipientRosterRecords.find(item => {
    return item.payeeName === name && item.payeeAccount === account
  })

  if (!matchedRecipient) {
    throw new Error('未匹配到收款人开户行，请手动选择开户行')
  }

  return enrichRecipient(clone(matchedRecipient))
}

export async function searchRecipientRoster({ payerId, query }) {
  await wait(220)
  const normalizedQuery = (query || '').trim().toLowerCase()

  if (normalizedQuery.length < 3) {
    return []
  }

  const baseMatched = recipientRosterRecords.filter(item => {
    const matchText = `${item.payeeName}${item.payeeAccount}`.toLowerCase()
    return matchText.includes(normalizedQuery)
  })

  const matched = payerId
    ? baseMatched.filter(item => item.payerIds.includes(payerId))
    : baseMatched

  return matched.map(item => {
    const enriched = enrichRecipient(item)
    return {
      id: enriched.id,
      label: `${enriched.payeeName} / ${enriched.payeeAccount}`,
      value: enriched.id,
      payeeType: enriched.payeeType,
      payeeName: enriched.payeeName,
      payeeAccount: enriched.payeeAccount,
      bankName: enriched.bankName,
      branchName: enriched.branchName,
      bankCode: enriched.bankCode,
      bankDisplayName: enriched.bankDisplayName
    }
  })
}

export async function fetchRecipientById(recipientId) {
  await wait(120)
  const matched = recipientRosterRecords.find(item => item.id === recipientId)
  return matched ? enrichRecipient(clone(matched)) : null
}

function enrichQuickDocument(document) {
  const branch = bankBranchRecords.find(item => item.bankCode === document.bankCode)
  const payer = payerRecords.find(item => item.id === document.payerId)

  return {
    ...document,
    payerName: payer ? payer.name : '',
    bankName: branch ? branch.bankName : '',
    branchName: branch ? branch.branchName : '',
    bankDisplayName: branch ? `${branch.bankName} ${branch.branchName}` : ''
  }
}

export async function fetchQuickDocuments({ keyword = '', page = 1, pageSize = 8 } = {}) {
  await wait(220)
  const normalizedKeyword = keyword.trim().toLowerCase()

  const filtered = normalizedKeyword
    ? quickDocumentRecords.filter(item => {
        const text = [
          item.documentNo,
          item.documentTitle,
          item.payeeName,
          item.payeeAccount,
          item.purpose,
          item.purposeDetail || ''
        ].join('').toLowerCase()

        return text.includes(normalizedKeyword)
      })
    : quickDocumentRecords

  const start = (page - 1) * pageSize
  const list = filtered
    .slice(start, start + pageSize)
    .map(item => enrichQuickDocument(clone(item)))

  return {
    list,
    total: filtered.length
  }
}

export async function fetchQuickDocumentById(documentId) {
  await wait(120)
  const matched = quickDocumentRecords.find(item => item.id === documentId)
  return matched ? enrichQuickDocument(clone(matched)) : null
}
