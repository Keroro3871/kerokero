// 구독 목록을 저장할 때 사용할 localStorage 키와 HTML 요소를 가져옵니다.
const storageKey = "subtracker-subscriptions";
const subscriptionForm = document.getElementById("subscription-form");
const subscriptionList = document.getElementById("subscription-list");
const cancelEditButton = document.getElementById("cancel-edit");
const submitButton = document.getElementById("submit-button");
// 페이지를 열면 브라우저에 저장된 구독을 먼저 불러옵니다.
let subscriptions = loadSubscriptions();
// 수정 중인 구독의 id입니다. null이면 새 구독을 추가하는 상태입니다.
let editingId = null;

// localStorage에 저장된 구독 목록을 읽어 배열로 돌려줍니다.
function loadSubscriptions() {
  try {
    const savedValue = localStorage.getItem(storageKey);
    if (savedValue === null) {
      // 처음 사용하는 브라우저에는 아직 저장된 구독이 없습니다.
      return [];
    }
    // localStorage의 문자열을 JavaScript 배열로 바꿉니다.
    const parsedValue = JSON.parse(savedValue);
    if (!Array.isArray(parsedValue)) {
      throw new Error("Saved subscriptions are not an array.");
    }
    return parsedValue;
  } catch (error) {
    setStatus("저장된 구독 정보를 읽지 못했어요. 브라우저 저장 공간의 데이터 형식을 확인해 주세요.");
    console.error("Unable to load saved subscriptions.", error);
    return [];
  }
}

// 현재 구독 목록을 JSON 문자열로 바꿔 브라우저에 저장합니다.
function saveSubscriptions() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(subscriptions));
    setStatus("");
    return true;
  } catch (error) {
    setStatus("브라우저에 구독 정보를 저장하지 못했어요. 저장 공간 설정을 확인해 주세요.");
    console.error("Unable to save subscriptions.", error);
    return false;
  }
}

// 목록 데이터가 바뀌었을 때 요약과 화면의 구독 목록을 다시 그립니다.
function refreshDashboard() {
  renderDashboard(subscriptions);
}

// 입력값과 수정 상태를 초기화해 새 구독 입력 화면으로 돌아갑니다.
function resetForm() {
  subscriptionForm.reset();
  editingId = null;
  document.getElementById("form-eyebrow").textContent = "GET STARTED";
  document.getElementById("form-title").textContent = "구독 추가";
  submitButton.innerHTML = '구독 추가하기 <span aria-hidden="true">＋</span>';
  cancelEditButton.hidden = true;
}

// 선택한 구독 정보를 폼에 채우고 수정 모드로 바꿉니다.
function startEditing(subscription) {
  editingId = subscription.id;
  subscriptionForm.elements.name.value = subscription.name;
  subscriptionForm.elements.amount.value = String(subscription.amount);
  subscriptionForm.elements.cycle.value = subscription.cycle;
  subscriptionForm.elements.nextPaymentDate.value = subscription.nextPaymentDate;
  subscriptionForm.elements.category.value = subscription.category;
  subscriptionForm.elements.paymentMethod.value = subscription.paymentMethod;
  document.getElementById("form-eyebrow").textContent = "EDIT SUBSCRIPTION";
  document.getElementById("form-title").textContent = "구독 수정";
  submitButton.innerHTML = '변경 내용 저장 <span aria-hidden="true">✓</span>';
  cancelEditButton.hidden = false;
  document.getElementById("name").focus();
}

// 구독을 구별할 고유 id를 만듭니다.
function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// 폼 제출은 새 구독 추가와 기존 구독 수정에 모두 사용합니다.
subscriptionForm.addEventListener("submit", event => {
  // 기본 제출 동작(페이지 새로고침)을 막습니다.
  event.preventDefault();
  // HTML의 필수 입력, 날짜, 숫자 조건을 먼저 확인합니다.
  if (!subscriptionForm.reportValidity()) {
    return;
  }

  // 폼의 입력값을 logic.js가 사용하는 구독 데이터 형태로 만듭니다.
  const formData = new FormData(subscriptionForm);
  const subscription = {
    id: editingId || createId(),
    name: String(formData.get("name")).trim(),
    amount: Number(formData.get("amount")),
    cycle: String(formData.get("cycle")),
    nextPaymentDate: String(formData.get("nextPaymentDate")),
    category: String(formData.get("category")).trim(),
    paymentMethod: String(formData.get("paymentMethod"))
  };

  // 이름과 카테고리가 비어 있지 않고 금액이 양의 정수인지 확인합니다.
  if (!subscription.name || !subscription.category || !Number.isSafeInteger(subscription.amount) || subscription.amount < 1) {
    setStatus("이름과 카테고리를 입력하고, 금액은 1원 이상의 정수로 입력해 주세요.");
    return;
  }

  // 수정 모드면 같은 id의 구독을 교체하고, 아니면 새 항목을 추가합니다.
  if (editingId) {
    subscriptions = subscriptions.map(item => item.id === editingId ? subscription : item);
  } else {
    subscriptions = [...subscriptions, subscription];
  }

  // 변경 사항을 저장하고 폼과 화면을 갱신합니다.
  saveSubscriptions();
  resetForm();
  refreshDashboard();
});

// 목록 안의 수정/삭제 버튼 클릭을 한 곳에서 처리합니다.
subscriptionList.addEventListener("click", event => {
  // 클릭된 요소가 수정 또는 삭제 버튼인지 확인합니다.
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  // 버튼의 id를 이용해 대상 구독을 찾습니다.
  const subscription = subscriptions.find(item => item.id === button.dataset.id);
  if (!subscription) {
    return;
  }

  // 수정 버튼이면 폼을 수정 모드로 바꿉니다.
  if (button.dataset.action === "edit") {
    startEditing(subscription);
    return;
  }

  // 삭제 버튼이면 목록에서 제거하고 저장한 뒤 화면을 다시 그립니다.
  if (button.dataset.action === "delete") {
    subscriptions = subscriptions.filter(item => item.id !== subscription.id);
    saveSubscriptions();
    // 수정 중이던 항목을 삭제했다면 수정 폼도 초기화합니다.
    if (editingId === subscription.id) {
      resetForm();
    }
    refreshDashboard();
  }
});

// 수정 취소 버튼은 입력 폼을 초기 상태로 되돌립니다.
cancelEditButton.addEventListener("click", resetForm);

// 처음 열었을 때 저장된 목록과 요약을 화면에 표시합니다.
refreshDashboard();
