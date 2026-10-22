// 카테고리 막대에 순서대로 사용할 색상과 원화 숫자 표시기를 준비합니다.
const categoryColors = ["#7566df", "#53b7a1", "#f0a75d", "#e87991", "#5c9ee5", "#a47bd2"];
const wonFormatter = new Intl.NumberFormat("ko-KR");

// 금액을 천 단위 구분 기호가 있는 원화 문자열로 바꿉니다.
function formatWon(amount) {
  return `₩${wonFormatter.format(amount)}`;
}

// 날짜 계산 함수에 전달할 오늘 날짜를 YYYY-MM-DD 형식으로 만듭니다.
function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 요약 카드, 구독 목록, 카테고리별 지출을 한 번에 화면에 반영합니다.
function renderDashboard(subscriptions) {
  const today = getTodayString();
  // logic.js의 계산 함수를 사용해 월 합계와 7일 이내 결제 목록을 구합니다.
  const monthlyTotal = getTotalMonthlyAmount(subscriptions);
  const upcoming = getUpcomingPayments(subscriptions, today, 7)
    .sort((first, second) => first.nextPaymentDate.localeCompare(second.nextPaymentDate));

  // 요약 영역의 숫자와 안내 문구를 갱신합니다.
  document.getElementById("today-label").textContent = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(new Date());
  document.getElementById("monthly-total").textContent = formatWon(monthlyTotal);
  document.getElementById("yearly-total").textContent = formatWon(getTotalYearlyAmount(subscriptions));
  document.getElementById("upcoming-count").textContent = `${upcoming.length}건`;
  document.getElementById("upcoming-caption").textContent = upcoming.length
    ? upcoming.map(subscription => subscription.name).join(", ")
    : "앞으로 7일 이내 결제";
  document.getElementById("subscription-count").textContent = String(subscriptions.length);

  // 상세 목록과 카테고리별 비중도 최신 구독 데이터로 다시 그립니다.
  renderSubscriptionList(subscriptions, today);
  renderCategories(subscriptions, monthlyTotal);
}

// 구독 데이터를 결제일 순으로 정렬해 카드 목록으로 화면에 표시합니다.
function renderSubscriptionList(subscriptions, today) {
  const list = document.getElementById("subscription-list");
  // 이전에 그린 카드를 지워 중복 표시를 방지합니다.
  list.replaceChildren();

  if (subscriptions.length === 0) {
    // 등록된 구독이 없을 때는 안내 문구를 보여줍니다.
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "아직 등록된 구독이 없어요. 오른쪽 폼에서 첫 구독을 추가해 보세요.";
    list.append(emptyState);
    return;
  }

  // 원본 배열은 그대로 두고, 복사본만 다음 결제일 순으로 정렬합니다.
  const sortedSubscriptions = [...subscriptions].sort((first, second) =>
    first.nextPaymentDate.localeCompare(second.nextPaymentDate)
  );

  // 구독마다 서비스 정보, 결제일, 수정/삭제 버튼이 있는 카드를 만듭니다.
  sortedSubscriptions.forEach(subscription => {
    // logic.js에서 오늘부터 결제일까지 남은 날짜를 계산합니다.
    const daysUntilPayment = getDaysUntilPayment(today, subscription.nextPaymentDate);
    const card = document.createElement("article");
    card.className = "subscription-card";

    const main = document.createElement("div");
    main.className = "subscription-main";

    const mark = document.createElement("span");
    mark.className = "service-mark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = subscription.name.trim().charAt(0).toUpperCase() || "?";

    // 서비스 이름과 카테고리, 결제 주기와 수단, 금액을 카드에 구성합니다.
    const details = document.createElement("div");
    details.className = "service-details";
    const titleRow = document.createElement("div");
    titleRow.className = "service-title-row";
    const name = document.createElement("h3");
    name.className = "service-name";
    name.textContent = subscription.name;
    const category = document.createElement("span");
    category.className = "category-tag";
    category.textContent = subscription.category;
    titleRow.append(name, category);

    const meta = document.createElement("div");
    meta.className = "service-meta";
    const cycle = document.createElement("span");
    cycle.textContent = subscription.cycle === "yearly" ? "매년 결제" : "매월 결제";
    const paymentMethod = document.createElement("span");
    paymentMethod.textContent = subscription.paymentMethod;
    const nextDate = document.createElement("span");
    nextDate.textContent = `다음 결제 ${subscription.nextPaymentDate}`;
    meta.append(cycle, paymentMethod, nextDate);

    const price = document.createElement("p");
    price.className = "service-price";
    price.textContent = formatWon(subscription.amount);
    const originalCycle = document.createElement("span");
    originalCycle.textContent = subscription.cycle === "yearly" ? " / 년" : " / 월";
    price.append(originalCycle);
    details.append(titleRow, meta, price);
    main.append(mark, details);

    // 결제일까지 남은 일수를 D-day 문구로 표시합니다.
    const side = document.createElement("div");
    side.className = "card-side";
    const dday = document.createElement("span");
    dday.className = "dday";
    if (daysUntilPayment < 0) {
      dday.classList.add("is-past");
      dday.textContent = "결제일 지남";
    } else if (daysUntilPayment === 0) {
      dday.classList.add("is-today");
      dday.textContent = "오늘 결제";
    } else {
      dday.textContent = `D-${daysUntilPayment}`;
    }

    // 각 버튼에 작업 종류와 구독 id를 기록해 main.js가 클릭을 처리하게 합니다.
    const actions = document.createElement("div");
    actions.className = "card-actions";
    const editButton = document.createElement("button");
    editButton.className = "card-action";
    editButton.type = "button";
    editButton.dataset.action = "edit";
    editButton.dataset.id = subscription.id;
    editButton.textContent = "수정";
    const deleteButton = document.createElement("button");
    deleteButton.className = "card-action";
    deleteButton.type = "button";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = subscription.id;
    deleteButton.textContent = "삭제";
    actions.append(editButton, deleteButton);
    side.append(dday, actions);

    card.append(main, side);
    list.append(card);
  });
}

// 월 기준 금액을 카테고리별로 합산해 금액과 막대로 비중을 보여줍니다.
function renderCategories(subscriptions, monthlyTotal) {
  const list = document.getElementById("category-list");
  list.replaceChildren();

  if (monthlyTotal === 0) {
    // 합계가 0이면 비율을 계산하지 않고 빈 상태 안내를 보여줍니다.
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "구독을 추가하면 카테고리별 지출 비중을 볼 수 있어요.";
    list.append(emptyState);
    return;
  }

  // logic.js의 결과를 지출이 큰 카테고리부터 표시합니다.
  const totals = getMonthlyAmountByCategory(subscriptions);
  Object.entries(totals)
    .sort((first, second) => second[1] - first[1])
    .forEach(([category, amount], index) => {
      // 카테고리별 색상, 합계, 전체 월 지출 중 차지하는 비율을 만듭니다.
      const color = categoryColors[index % categoryColors.length];
      const row = document.createElement("div");
      row.className = "category-row";

      const heading = document.createElement("div");
      heading.className = "category-row-heading";
      const name = document.createElement("span");
      name.className = "category-name";
      const dot = document.createElement("span");
      dot.className = "category-dot";
      dot.style.backgroundColor = color;
      const label = document.createElement("span");
      label.textContent = category;
      name.append(dot, label);

      const total = document.createElement("span");
      total.className = "category-total";
      total.textContent = `${formatWon(amount)} · ${Math.round((amount / monthlyTotal) * 100)}%`;
      heading.append(name, total);

      // 막대의 너비를 비율에 맞추고 보조 기술에 필요한 설명도 설정합니다.
      const track = document.createElement("div");
      track.className = "category-track";
      track.setAttribute("role", "meter");
      track.setAttribute("aria-label", `${category} 비중`);
      track.setAttribute("aria-valuemin", "0");
      track.setAttribute("aria-valuemax", "100");
      track.setAttribute("aria-valuenow", String(Math.round((amount / monthlyTotal) * 100)));
      const bar = document.createElement("div");
      bar.className = "category-bar";
      bar.style.width = `${Math.min(100, (amount / monthlyTotal) * 100)}%`;
      bar.style.backgroundColor = color;
      track.append(bar);
      row.append(heading, track);
      list.append(row);
    });
}

// 저장이나 입력 처리 중 발생한 안내 메시지를 화면에 표시합니다.
function setStatus(message) {
  document.getElementById("status-message").textContent = message;
}
