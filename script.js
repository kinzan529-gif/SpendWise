const USERS_KEY = "spendwise_users";
const CURRENT_USER_KEY = "spendwise_current_user";

const $ = id => document.getElementById(id);
const $$ = selector => document.querySelectorAll(selector);

let cashFlowChart = null;
let reportChart = null;


/* STORAGE */

function getUsers() {
    try {
        const users = JSON.parse(
            localStorage.getItem(USERS_KEY)
        );

        return Array.isArray(users)
            ? users
            : [];
    } catch {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(
        USERS_KEY,
        JSON.stringify(users)
    );
}

function getCurrentUser() {
    const email = localStorage.getItem(
        CURRENT_USER_KEY
    );

    return getUsers().find(
        user => user.email === email
    );
}

function saveCurrentUser(updatedUser) {
    const users = getUsers().map(user =>
        user.id === updatedUser.id
            ? updatedUser
            : user
    );

    saveUsers(users);
}


/* HELPERS */

function money(value) {
    return `Rs. ${Number(
        value || 0
    ).toLocaleString("en-PK")}`;
}

function safe(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showMessage(element, text, type) {
    element.textContent = text;
    element.className = `form-message ${type}`;
}


/* AUTHENTICATION TABS */

function showLogin() {
    $("loginTab").classList.add("active");
    $("signupTab").classList.remove("active");

    $("loginForm").classList.remove("hidden");
    $("signupForm").classList.add("hidden");

    $("loginMessage").textContent = "";
    $("signupMessage").textContent = "";
}

function showSignup() {
    $("signupTab").classList.add("active");
    $("loginTab").classList.remove("active");

    $("signupForm").classList.remove("hidden");
    $("loginForm").classList.add("hidden");

    $("loginMessage").textContent = "";
    $("signupMessage").textContent = "";
}

function showAuthentication() {
    $("mainApp").classList.add("hidden");
    $("authPage").classList.remove("hidden");

    showLogin();
}

function showApplication() {
    if (!getCurrentUser()) {
        showAuthentication();
        return;
    }

    $("authPage").classList.add("hidden");
    $("mainApp").classList.remove("hidden");

    setDateAndGreeting();
    updateProfile();
    showSection("dashboard");
    renderEverything();
}


/* USER PROFILE */

function createInitials(name) {
    const parts = name
        .trim()
        .split(/\s+/);

    if (parts.length === 1) {
        return parts[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
}

function updateProfile() {
    const user = getCurrentUser();

    if (!user) {
        return;
    }

    $("sidebarUserName").textContent =
        user.name;

    $("sidebarUserEmail").textContent =
        user.email;

    $("profileAvatar").textContent =
        createInitials(user.name);

    $("settingsName").value =
        user.name;

    $("settingsEmail").value =
        user.email;

    $("settingsCurrency").value =
        user.currency || "PKR";
}


/* GREETING AND QUOTES */

const dailyQuotes = [
    "Small savings today can create big opportunities tomorrow.",
    "A budget gives every rupee a clear purpose.",
    "Track your progress, not only your expenses.",
    "Financial freedom begins with one smart decision.",
    "Spend with intention and save with purpose.",
    "Every rupee you save is a step towards your goal.",
    "A clear budget creates a clear mind.",
    "Make your money support your dreams.",
    "Smart money choices today build a stronger tomorrow.",
    "Saving consistently matters more than saving perfectly.",
    "Your budget is a plan for your priorities.",
    "Track today so you can improve tomorrow."
];

function getLocalDate(date = new Date()) {
    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function setDateAndGreeting() {
    const user = getCurrentUser();

    if (!user) {
        return;
    }

    const hour = new Date().getHours();

    let greeting = "Good night";
    let icon = "🌙";

    if (hour >= 5 && hour < 12) {
        greeting = "Good morning";
        icon = "☀️";
    } else if (hour >= 12 && hour < 17) {
        greeting = "Good afternoon";
        icon = "🌤️";
    } else if (hour >= 17 && hour < 21) {
        greeting = "Good evening";
        icon = "🌆";
    }

    const firstName =
        user.name.split(" ")[0];

    $("greetingHeading").innerHTML = `
        <span class="greeting-text">
            ${greeting}, ${safe(firstName)}!
        </span>

        <span class="greeting-icon">
            ${icon}
        </span>
    `;

    $("currentDate").textContent =
        new Date().toLocaleDateString(
            "en-GB",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

    const startOfYear = new Date(
        new Date().getFullYear(),
        0,
        0
    );

    const dayNumber = Math.floor(
        (new Date() - startOfYear) /
        86400000
    );

    $("dailyQuote").textContent =
        dailyQuotes[
            dayNumber % dailyQuotes.length
        ];

    $("transactionDate").value =
        getLocalDate();
}


/* FINANCIAL CALCULATIONS */

function calculateSummary(
    user = getCurrentUser()
) {
    const allTransactions =
        Array.isArray(user.transactions)
            ? user.transactions
            : [];

    const now = new Date();

    const transactions = allTransactions.filter(
        transaction => {
            const date = new Date(
                `${transaction.date}T00:00:00`
            );

            return (
                date.getFullYear() === now.getFullYear() &&
                date.getMonth() === now.getMonth()
            );
        }
    );

    const income = transactions
        .filter(
            transaction =>
                transaction.type === "income"
        )
        .reduce(
            (total, transaction) =>
                total +
                Number(transaction.amount),
            0
        );

    const expenses = transactions
        .filter(
            transaction =>
                transaction.type === "expense"
        )
        .reduce(
            (total, transaction) =>
                total +
                Number(transaction.amount),
            0
        );

    const budget = Number(
        user.budget || 0
    );

    const hasBudget = budget > 0;

    return {
        income,
        expenses,
        budget,
        hasBudget,
        balance: income - expenses,
        budgetLeft: hasBudget
            ? budget - expenses
            : 0
    };
}


/* SIDEBAR NAVIGATION */

function showSection(sectionName) {
    const sections = [
        "dashboard",
        "transactions",
        "budget",
        "reports",
        "settings"
    ];

    sections.forEach(name => {
        const section = $(
            `${name}Section`
        );

        const button =
            document.querySelector(
                `[data-section="${name}"]`
            );

        section.classList.toggle(
            "hidden",
            name !== sectionName
        );

        button.classList.toggle(
            "active",
            name === sectionName
        );
    });

    $("sidebar").classList.remove("open");
    $("profileMenu").classList.add("hidden");

    if (sectionName === "reports") {
        setTimeout(
            renderReportChart,
            50
        );
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* MODALS */

function openModal(modal) {
    modal.classList.remove("hidden");
    document.body.style.overflow =
        "hidden";
}

function closeModal(modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
}


/* TRANSACTION OPTIONS */

const transactionOptions = {
    expense: {
        placeholder:
            "For example: Grocery shopping",

        categories: [
            "Groceries",
            "Transport",
            "Rent",
            "Dining Out",
            "Utilities",
            "Shopping",
            "Education",
            "Health",
            "Entertainment",
            "Other"
        ],

        methods: [
            "Cash",
            "Bank Transfer",
            "Debit Card",
            "Credit Card",
            "Easypaisa",
            "JazzCash",
            "Other"
        ]
    },

    income: {
        placeholder:
            "For example: Monthly salary",

        categories: [
            "Salary",
            "Freelance",
            "Business",
            "Bonus",
            "Investment",
            "Gift",
            "Rental Income",
            "Other"
        ],

        methods: [
            "Cash",
            "Bank Transfer",
            "Cheque",
            "Easypaisa",
            "JazzCash",
            "Other"
        ]
    }
};

function updateTransactionFields(type) {
    const options =
        transactionOptions[type];

    $("transactionDescription")
        .placeholder =
        options.placeholder;

    $("transactionCategory").innerHTML = `
        <option value="">
            Select ${type} category
        </option>

        ${options.categories
            .map(category => `
                <option value="${category}">
                    ${category}
                </option>
            `)
            .join("")}
    `;

    $("paymentMethod").innerHTML = `
        <option value="">
            ${
                type === "income"
                    ? "Select receiving method"
                    : "Select payment method"
            }
        </option>

        ${options.methods
            .map(method => `
                <option value="${method}">
                    ${method}
                </option>
            `)
            .join("")}
    `;
}

function openTransactionModal() {
    $("transactionForm").reset();

    document.querySelector(
        '[name="transactionType"][value="expense"]'
    ).checked = true;

    updateTransactionFields(
        "expense"
    );

    $("transactionDate").value =
        getLocalDate();

    openModal(
        $("transactionModal")
    );
}


/* COMPLETE RENDERING */

function renderEverything() {
    const user = getCurrentUser();

    if (!user) {
        return;
    }

    if (!Array.isArray(user.transactions)) {
        user.transactions = [];
        saveCurrentUser(user);
    }

    renderSummary();
    renderTransactions();
    renderCategories();
    renderBudget();
    renderCashFlowChart();
    renderReportSummary();
    renderNotifications();
}


/* SUMMARY CARDS */

function renderSummary() {
    const data =
        calculateSummary();

    $("totalBalance").textContent =
        money(data.balance);

    $("totalIncome").textContent =
        money(data.income);

    $("totalExpenses").textContent =
        money(data.expenses);

    $("budgetLeft").textContent =
        data.hasBudget
            ? money(data.budgetLeft)
            : "Not set";

    $("chartTotalIncome").textContent =
        money(data.income);

    $("chartTotalExpenses").textContent =
        money(data.expenses);

    $("chartNetBalance").textContent =
        money(data.balance);
}


/* TRANSACTION TABLES */

function getSortedTransactions() {
    const user = getCurrentUser();

    return [...user.transactions].sort(
        (first, second) => {
            const dateDifference =
                new Date(second.date) -
                new Date(first.date);

            if (dateDifference !== 0) {
                return dateDifference;
            }

            return (
                Number(second.id) -
                Number(first.id)
            );
        }
    );
}

function createTransactionRow(
    transaction,
    includePaymentMethod
) {
    const isIncome =
        transaction.type === "income";

    const transactionDate = new Date(
        `${transaction.date}T00:00:00`
    ).toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

    const paymentColumn =
        includePaymentMethod
            ? `
                <td>
                    ${safe(
                        transaction.paymentMethod
                    )}
                </td>
            `
            : "";

    const amountClass = isIncome
        ? "income-amount"
        : "expense-amount";

    return `
        <tr>
            <td>${transactionDate}</td>

            <td>
                ${safe(
                    transaction.description
                )}
            </td>

            <td>
                <span class="category-badge">
                    ${safe(
                        transaction.category
                    )}
                </span>
            </td>

            ${paymentColumn}

            <td class="${amountClass}">
                ${isIncome ? "+" : "-"}
                ${money(transaction.amount)}
            </td>

            <td class="${amountClass}">
                <i
                    class="fa-solid fa-arrow-${
                        isIncome
                            ? "up"
                            : "down"
                    } type-arrow"
                ></i>
            </td>

            <td>
                <button
                    type="button"
                    class="delete-transaction"
                    data-id="${transaction.id}"
                    aria-label="Delete transaction"
                >
                    <i
                        class="fa-regular fa-trash-can"
                    ></i>
                </button>
            </td>
        </tr>
    `;
}

function renderTransactions() {
    const transactions =
        getSortedTransactions();

    const recentTransactions =
        transactions.slice(0, 5);

    $("recentTransactionBody").innerHTML =
        recentTransactions
            .map(transaction =>
                createTransactionRow(
                    transaction,
                    false
                )
            )
            .join("");

    $("recentEmptyState")
        .classList
        .toggle(
            "hidden",
            recentTransactions.length > 0
        );

    const searchText =
        $("transactionSearch")
            .value
            .trim()
            .toLowerCase();

    const selectedType =
        $("typeFilter").value;

    const selectedCategory =
        $("categoryFilter").value;

    const filteredTransactions =
        transactions.filter(
            transaction => {
                const matchesSearch =
                    transaction.description
                        .toLowerCase()
                        .includes(searchText) ||
                    transaction.category
                        .toLowerCase()
                        .includes(searchText);

                const matchesType =
                    selectedType === "all" ||
                    transaction.type ===
                        selectedType;

                const matchesCategory =
                    selectedCategory === "all" ||
                    transaction.category ===
                        selectedCategory;

                return (
                    matchesSearch &&
                    matchesType &&
                    matchesCategory
                );
            }
        );

    $("allTransactionBody").innerHTML =
        filteredTransactions
            .map(transaction =>
                createTransactionRow(
                    transaction,
                    true
                )
            )
            .join("");

    $("allTransactionsEmptyState")
        .classList
        .toggle(
            "hidden",
            filteredTransactions.length > 0
        );
}


/* CATEGORIES */

const categoryIcons = {
    "Groceries": "fa-cart-shopping",
    "Transport": "fa-car",
    "Rent": "fa-house",
    "Dining Out": "fa-utensils",
    "Utilities":
        "fa-mobile-screen-button",
    "Shopping": "fa-bag-shopping",
    "Education": "fa-graduation-cap",
    "Health": "fa-heart-pulse",
    "Entertainment": "fa-film",
    "Other": "fa-ellipsis"
};

function renderCategories() {
    const user = getCurrentUser();

    const now = new Date();

    const expenses =
        user.transactions.filter(
            transaction => {
                const date = new Date(
                    `${transaction.date}T00:00:00`
                );

                return (
                    transaction.type === "expense" &&
                    date.getFullYear() === now.getFullYear() &&
                    date.getMonth() === now.getMonth()
                );
            }
        );

    const totals = {};

    expenses.forEach(transaction => {
        totals[transaction.category] =
            (
                totals[
                    transaction.category
                ] || 0
            ) +
            Number(transaction.amount);
    });

    const totalExpenses =
        expenses.reduce(
            (total, transaction) =>
                total +
                Number(transaction.amount),
            0
        );

    const categories =
        Object.entries(totals)
            .sort(
                (first, second) =>
                    second[1] - first[1]
            )
            .slice(0, 6);

    if (categories.length === 0) {
        $("categoryList").innerHTML = `
            <div class="empty-state">
                <i
                    class="fa-solid fa-chart-pie"
                ></i>

                <h4>
                    No expense categories yet
                </h4>

                <p>
                    Add expenses to see category insights.
                </p>
            </div>
        `;

        return;
    }

    $("categoryList").innerHTML =
        categories
            .map(([category, amount]) => {
                const percentage =
                    Math.round(
                        (
                            amount /
                            totalExpenses
                        ) * 100
                    );

                const icon =
                    categoryIcons[category] ||
                    categoryIcons.Other;

                return `
                    <div class="category-item">

                        <div class="category-icon">
                            <i
                                class="fa-solid ${icon}"
                            ></i>
                        </div>

                        <div class="category-content">

                            <strong>
                                ${safe(category)}
                            </strong>

                            <div class="category-progress">
                                <span
                                    style="width: ${percentage}%"
                                ></span>
                            </div>

                        </div>

                        <span class="category-percentage">
                            ${percentage}%
                        </span>

                        <span class="category-amount">
                            ${money(amount)}
                        </span>

                    </div>
                `;
            })
            .join("");
}


/* BUDGET */

function renderBudget() {
    const data =
        calculateSummary();

    if (!data.hasBudget) {
        $("editBudgetButton").innerHTML = `
            <i class="fa-solid fa-plus"></i>
            Set Monthly Budget
        `;

        $("budgetPercentage").textContent =
            "0%";

        $("budgetUsed").textContent =
            money(data.expenses);

        $("budgetRemaining").textContent =
            "Not set";

        $("totalBudget").textContent =
            "Not set";

        $("budgetPageTotal").textContent =
            "Not set";

        $("budgetPageSpent").textContent =
            money(data.expenses);

        $("budgetPageRemaining").textContent =
            "Not set";

        $("budgetProgressValue").style.width =
            "0%";

        $("budgetCircleProgress")
            .style
            .strokeDashoffset = 440;

        $("budgetMessage").textContent =
            "Set your monthly budget to start tracking your progress.";

        return;
    }

    $("editBudgetButton").innerHTML = `
        <i class="fa-solid fa-pen"></i>
        Edit Monthly Budget
    `;

    const percentage = Math.min(
        100,
        Math.max(
            0,
            Math.round(
                (
                    data.expenses /
                    data.budget
                ) * 100
            ) || 0
        )
    );

    $("budgetPercentage").textContent =
        `${percentage}%`;

    $("budgetUsed").textContent =
        money(data.expenses);

    $("budgetRemaining").textContent =
        money(data.budgetLeft);

    $("totalBudget").textContent =
        money(data.budget);

    $("budgetPageTotal").textContent =
        money(data.budget);

    $("budgetPageSpent").textContent =
        money(data.expenses);

    $("budgetPageRemaining").textContent =
        money(data.budgetLeft);

    $("budgetProgressValue").style.width =
        `${percentage}%`;

    $("budgetCircleProgress")
        .style
        .strokeDashoffset =
        440 -
        (440 * percentage) / 100;

    if (data.budgetLeft < 0) {
        $("budgetMessage").textContent =
            `You exceeded your budget by ${money(
                Math.abs(
                    data.budgetLeft
                )
            )}.`;
    } else if (percentage >= 80) {
        $("budgetMessage").textContent =
            `Careful! Only ${money(
                data.budgetLeft
            )} remains in your budget.`;
    } else if (data.expenses > 0) {
        $("budgetMessage").textContent =
            `You’re doing great! You have ${money(
                data.budgetLeft
            )} left in your budget.`;
    } else {
        $("budgetMessage").textContent =
            `Your monthly budget is ${money(
                data.budget
            )}. Add expenses to track progress.`;
    }
}


/* CASH-FLOW CHART */

function renderCashFlowChart() {
    if (!window.Chart) {
        return;
    }

    const user = getCurrentUser();

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthName = now.toLocaleDateString(
        "en-GB",
        { month: "short" }
    );
    const lastDay = new Date(
        year,
        month + 1,
        0
    ).getDate();

    const points = [...new Set([
        1, 5, 10, 15, 20, 25, lastDay
    ].filter(day => day <= lastDay))];

    function cumulative(type, day) {
        return user.transactions
            .filter(transaction => {
                const transactionDay =
                    new Date(
                        `${transaction.date}T00:00:00`
                    ).getDate();

                const transactionDate =
                    new Date(
                        `${transaction.date}T00:00:00`
                    );

                return (
                    transaction.type === type &&
                    transactionDate.getFullYear() === year &&
                    transactionDate.getMonth() === month &&
                    transactionDay <= day
                );
            })
            .reduce(
                (total, transaction) =>
                    total +
                    Number(
                        transaction.amount
                    ),
                0
            );
    }

    const incomeData =
        points.map(day =>
            cumulative("income", day)
        );

    const expenseData =
        points.map(day =>
            cumulative("expense", day)
        );

    const balanceData =
        incomeData.map(
            (income, index) =>
                income -
                expenseData[index]
        );

    if (cashFlowChart) {
        cashFlowChart.destroy();
    }

    cashFlowChart = new Chart(
        $("cashFlowChart"),
        {
            type: "line",

            data: {
                labels: points.map(
                    day => `${day} ${monthName}`
                ),

                datasets: [
                    {
                        label: "Income",
                        data: incomeData,
                        borderColor: "#0aa673",
                        borderWidth: 2.5,
                        tension: 0.35
                    },
                    {
                        label: "Expenses",
                        data: expenseData,
                        borderColor: "#ff4d4f",
                        borderWidth: 2.5,
                        tension: 0.35
                    },
                    {
                        label:
                            "Net Cash Flow",
                        data: balanceData,
                        borderColor:
                            "#59c99f",
                        backgroundColor:
                            "rgba(10,166,115,0.09)",
                        borderWidth: 2,
                        fill: true,
                        tension: 0.35
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        display: false
                    }
                },

                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        }
    );
}


/* REPORTS */

function renderReportSummary() {
    const data =
        calculateSummary();

    $("reportIncome").textContent =
        money(data.income);

    $("reportExpenses").textContent =
        money(data.expenses);

    $("reportBalance").textContent =
        money(data.balance);
}

function renderReportChart() {
    if (!window.Chart) {
        return;
    }

    const data =
        calculateSummary();

    if (reportChart) {
        reportChart.destroy();
    }

    reportChart = new Chart(
        $("reportChart"),
        {
            type: "doughnut",

            data: {
                labels: [
                    "Income",
                    "Expenses",
                    "Balance"
                ],

                datasets: [
                    {
                        data: [
                            data.income,
                            data.expenses,
                            Math.max(
                                data.balance,
                                0
                            )
                        ],

                        backgroundColor: [
                            "#0aa673",
                            "#ff4d4f",
                            "#f4a51c"
                        ],

                        borderWidth: 0
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "67%"
            }
        }
    );
}


/* NOTIFICATIONS */

function getNotifications() {
    const user = getCurrentUser();

    if (!user) {
        return [];
    }

    const data =
        calculateSummary(user);

    const notifications = [];

    if (user.transactions.length === 0) {
        notifications.push({
            title: "Welcome to SpendWise",
            text:
                "Add your first income or expense to begin tracking.",
            icon: "fa-wallet"
        });
    } else {
        const latest =
            getSortedTransactions()[0];

        notifications.push({
            title:
                latest.type === "income"
                    ? "Income recorded"
                    : "Expense recorded",

            text:
                `${latest.description}: ${money(
                    latest.amount
                )}`,

            icon:
                latest.type === "income"
                    ? "fa-arrow-trend-up"
                    : "fa-arrow-trend-down"
        });
    }

    if (!data.hasBudget) {
        notifications.push({
            title: "Budget not set",
            text:
                "Set a monthly budget to track your spending progress.",
            icon: "fa-chart-pie"
        });
    } else if (data.budgetLeft < 0) {
        notifications.push({
            title: "Budget exceeded",
            text:
                `You are ${money(
                    Math.abs(
                        data.budgetLeft
                    )
                )} over budget.`,
            icon:
                "fa-triangle-exclamation"
        });
    } else if (
        data.expenses / data.budget >=
        0.8
    ) {
        notifications.push({
            title: "Budget warning",
            text:
                `Only ${money(
                    data.budgetLeft
                )} remains in your budget.`,
            icon: "fa-circle-exclamation"
        });
    }

    return notifications;
}

function renderNotifications() {
    const panel =
        $("notificationPanel");

    if (!panel) {
        return;
    }

    const notifications =
        getNotifications();

    const notificationDot =
        document.querySelector(
            ".notification-button span"
        );

    if (notificationDot) {
        notificationDot.style.display =
            notifications.length
                ? "block"
                : "none";
    }

    panel.innerHTML = `
        <div class="notification-dropdown-header">

            <div>
                <strong>Notifications</strong>

                <small>
                    ${notifications.length}
                    update${
                        notifications.length === 1
                            ? ""
                            : "s"
                    }
                </small>
            </div>

            <button
                type="button"
                id="closeNotifications"
                aria-label="Close notifications"
            >
                <i class="fa-solid fa-xmark"></i>
            </button>

        </div>

        <div class="notification-panel-list">

            ${notifications
                .map(notification => `
                    <div class="notification-content">

                        <span class="notification-content-icon">
                            <i
                                class="fa-solid ${notification.icon}"
                            ></i>
                        </span>

                        <div>
                            <strong>
                                ${safe(
                                    notification.title
                                )}
                            </strong>

                            <p>
                                ${safe(
                                    notification.text
                                )}
                            </p>
                        </div>

                    </div>
                `)
                .join("")}

        </div>
    `;

    $("closeNotifications")
        .addEventListener(
            "click",
            () => {
                panel.classList.add(
                    "hidden"
                );
            }
        );
}

function setupNotifications() {
    const panel =
        document.createElement("div");

    panel.id = "notificationPanel";

    panel.className =
        "notification-dropdown hidden";

    document
        .querySelector(
            ".dashboard-actions"
        )
        .appendChild(panel);

    const notificationButton =
        document.querySelector(
            ".notification-button"
        );

    notificationButton.addEventListener(
            "click",
            event => {
                event.stopPropagation();

                renderNotifications();

                panel.classList.toggle(
                    "hidden"
                );

                notificationButton.setAttribute(
                    "aria-expanded",
                    String(!panel.classList.contains("hidden"))
                );
            }
        );

    panel.addEventListener(
        "click",
        event => {
            event.stopPropagation();
        }
    );

    document.addEventListener(
        "click",
        () => {
            panel.classList.add(
                "hidden"
            );

            notificationButton.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    );
}


/* ALL EVENTS */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupNotifications();


        /* Login and signup tabs */

        $("loginTab").addEventListener(
            "click",
            showLogin
        );

        $("signupTab").addEventListener(
            "click",
            showSignup
        );


        /* Password visibility */

        $$(".show-password-button")
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        const input = $(
                            button.dataset
                                .passwordTarget
                        );

                        input.type =
                            input.type ===
                            "password"
                                ? "text"
                                : "password";

                        button
                            .querySelector("i")
                            .className =
                            input.type ===
                            "password"
                                ? "fa-regular fa-eye"
                                : "fa-regular fa-eye-slash";
                    }
                );
            });


        /* Create account */

        $("signupForm").addEventListener(
            "submit",
            event => {
                event.preventDefault();

                const name =
                    $("signupName")
                        .value
                        .trim();

                const email =
                    $("signupEmail")
                        .value
                        .trim()
                        .toLowerCase();

                const password =
                    $("signupPassword").value;

                const users =
                    getUsers();

                if (name.length < 2) {
                    showMessage(
                        $("signupMessage"),
                        "Please enter your complete name.",
                        "error"
                    );

                    return;
                }

                if (password.length < 6) {
                    showMessage(
                        $("signupMessage"),
                        "Password must contain at least 6 characters.",
                        "error"
                    );

                    return;
                }

                if (
                    users.some(
                        user =>
                            user.email === email
                    )
                ) {
                    showMessage(
                        $("signupMessage"),
                        "An account already exists with this email.",
                        "error"
                    );

                    return;
                }

                const newUser = {
                    id:
                        Date.now().toString(),
                    name,
                    email,
                    password,
                    currency: "PKR",
                    budget: 0,
                    transactions: []
                };

                users.push(newUser);
                saveUsers(users);

                $("signupForm").reset();

                showLogin();

                $("loginEmail").value =
                    email;

                showMessage(
                    $("loginMessage"),
                    "Account created successfully! Please login to continue.",
                    "success"
                );
            }
        );


        /* Login */

        $("loginForm").addEventListener(
            "submit",
            event => {
                event.preventDefault();

                const email =
                    $("loginEmail")
                        .value
                        .trim()
                        .toLowerCase();

                const password =
                    $("loginPassword").value;

                const users =
                    getUsers();

                if (users.length === 0) {
                    showMessage(
                        $("loginMessage"),
                        "No account found. Please create your account first.",
                        "error"
                    );

                    return;
                }

                const user =
                    users.find(
                        account =>
                            account.email ===
                                email &&
                            account.password ===
                                password
                    );

                if (!user) {
                    showMessage(
                        $("loginMessage"),
                        "Incorrect email or password.",
                        "error"
                    );

                    return;
                }

                localStorage.setItem(
                    CURRENT_USER_KEY,
                    user.email
                );

                $("loginForm").reset();

                showApplication();

                if (Number(user.budget || 0) <= 0) {
                    $("budgetInput").value = "";

                    setTimeout(
                        () => openModal($("budgetModal")),
                        250
                    );
                }
            }
        );


        /* Transaction type */

        $$(
            'input[name="transactionType"]'
        ).forEach(option => {
            option.addEventListener(
                "change",
                () => {
                    updateTransactionFields(
                        option.value
                    );
                }
            );
        });


        /* Sidebar navigation */

        $$(".sidebar-link").forEach(
            link => {
                link.addEventListener(
                    "click",
                    () => {
                        showSection(
                            link.dataset.section
                        );
                    }
                );
            }
        );

        $$("[data-section-button]")
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        showSection(
                            button.dataset
                                .sectionButton
                        );
                    }
                );

                if (button.getAttribute("role") === "button") {
                    button.addEventListener(
                        "keydown",
                        event => {
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                showSection(button.dataset.sectionButton);
                            }
                        }
                    );
                }
            });


        /* Mobile menu */

        $("mobileMenuButton")
            .addEventListener(
                "click",
                () => {
                    $("sidebar")
                        .classList
                        .toggle("open");
                }
            );


        /* Profile menu */

        $("profileButton")
            .addEventListener(
                "click",
                event => {
                    event.stopPropagation();

                    $("profileMenu")
                        .classList
                        .toggle("hidden");
                }
            );

        document.addEventListener(
            "click",
            () => {
                $("profileMenu")
                    .classList
                    .add("hidden");
            }
        );

        $("profileSettingsButton")
            .addEventListener(
                "click",
                () => {
                    showSection(
                        "settings"
                    );
                }
            );


        /* Logout */

        $("logoutButton")
            .addEventListener(
                "click",
                () => {
                    localStorage.removeItem(
                        CURRENT_USER_KEY
                    );

                    showAuthentication();
                }
            );


        /* Open transaction modal */

        $("openTransactionModal")
            .addEventListener(
                "click",
                openTransactionModal
            );

        $("transactionsAddButton")
            .addEventListener(
                "click",
                openTransactionModal
            );


        /* Open budget modal */

        $("editBudgetButton")
            .addEventListener(
                "click",
                () => {
                    const user =
                        getCurrentUser();

                    $("budgetInput").value =
                        user.budget || "";

                    openModal(
                        $("budgetModal")
                    );
                }
            );


        /* Close modals */

        $$("[data-close-modal]")
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        closeModal(
                            $(
                                button.dataset
                                    .closeModal
                            )
                        );
                    }
                );
            });

        $$(".modal-overlay")
            .forEach(modal => {
                modal.addEventListener(
                    "click",
                    event => {
                        if (
                            event.target ===
                            modal
                        ) {
                            closeModal(
                                modal
                            );
                        }
                    }
                );
            });


        /* Save transaction */

        $("transactionForm")
            .addEventListener(
                "submit",
                event => {
                    event.preventDefault();

                    const user =
                        getCurrentUser();

                    if (!user) {
                        alert(
                            "Please login again."
                        );

                        return;
                    }

                    if (
                        !Array.isArray(
                            user.transactions
                        )
                    ) {
                        user.transactions =
                            [];
                    }

                    const selectedType =
                        document.querySelector(
                            'input[name="transactionType"]:checked'
                        ).value;

                    const transaction = {
                        id:
                            Date.now()
                                .toString(),

                        type: selectedType,

                        description:
                            $(
                                "transactionDescription"
                            )
                                .value
                                .trim(),

                        amount:
                            Number(
                                $(
                                    "transactionAmount"
                                ).value
                            ),

                        date:
                            $(
                                "transactionDate"
                            ).value,

                        category:
                            $(
                                "transactionCategory"
                            ).value,

                        paymentMethod:
                            $(
                                "paymentMethod"
                            ).value
                    };

                    if (
                        !transaction.description ||
                        !Number.isFinite(transaction.amount) ||
                        transaction.amount <= 0 ||
                        !transaction.date ||
                        !transaction.category ||
                        !transaction.paymentMethod
                    ) {
                        alert(
                            "Please complete all transaction fields correctly."
                        );
                        return;
                    }

                    user.transactions.push(
                        transaction
                    );

                    saveCurrentUser(user);

                    closeModal(
                        $("transactionModal")
                    );

                    $("transactionForm")
                        .reset();

                    renderEverything();
                }
            );


        /* Delete transaction */

        document.addEventListener(
            "click",
            event => {
                const deleteButton =
                    event.target.closest(
                        ".delete-transaction"
                    );

                if (!deleteButton) {
                    return;
                }

                const confirmed =
                    confirm(
                        "Delete this transaction?"
                    );

                if (!confirmed) {
                    return;
                }

                const user =
                    getCurrentUser();

                user.transactions =
                    user.transactions.filter(
                        transaction =>
                            transaction.id !==
                            deleteButton.dataset.id
                    );

                saveCurrentUser(user);
                renderEverything();
            }
        );


        /* Save budget */

        $("budgetForm")
            .addEventListener(
                "submit",
                event => {
                    event.preventDefault();

                    const user =
                        getCurrentUser();

                    const budget = Number(
                        $("budgetInput").value
                    );

                    if (
                        !Number.isFinite(budget) ||
                        budget <= 0
                    ) {
                        alert(
                            "Please enter a monthly budget greater than 0."
                        );
                        return;
                    }

                    user.budget = budget;

                    saveCurrentUser(user);

                    closeModal(
                        $("budgetModal")
                    );

                    renderEverything();
                }
            );


        /* Transaction filters */

        $("transactionSearch")
            .addEventListener(
                "input",
                renderTransactions
            );

        $("typeFilter")
            .addEventListener(
                "change",
                renderTransactions
            );

        $("categoryFilter")
            .addEventListener(
                "change",
                renderTransactions
            );


        /* Profile settings */

        $("settingsForm")
            .addEventListener(
                "submit",
                event => {
                    event.preventDefault();

                    const user =
                        getCurrentUser();

                    const newName =
                        $("settingsName")
                            .value
                            .trim();

                    if (
                        newName.length < 2
                    ) {
                        showMessage(
                            $(
                                "settingsMessage"
                            ),
                            "Please enter a valid name.",
                            "error"
                        );

                        return;
                    }

                    user.name =
                        newName;

                    user.currency =
                        $(
                            "settingsCurrency"
                        ).value;

                    saveCurrentUser(user);

                    updateProfile();
                    setDateAndGreeting();

                    showMessage(
                        $("settingsMessage"),
                        "Profile updated successfully.",
                        "success"
                    );
                }
            );


        /* Initial screen */

        localStorage.removeItem(
            CURRENT_USER_KEY
        );

        showAuthentication();
    }
);
