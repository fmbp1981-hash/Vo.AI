/**
 * Test Data for E2E Tests
 * Centralized data to be used across all test suites
 */

export const TEST_USERS = {
    admin: {
        email: process.env.E2E_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'fmbp1981@gmail.com',
        password: process.env.E2E_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Admin@123',
        name: 'Admin User',
        role: 'ADMIN',
    },
    consultant: {
        email: process.env.E2E_CONSULTANT_EMAIL || process.env.CONSULTANT_EMAIL || 'consultant@voai.test',
        password: process.env.E2E_CONSULTANT_PASSWORD || process.env.CONSULTANT_PASSWORD || 'Test@123456',
        name: 'Consultant User',
        role: 'CONSULTANT',
    },
    invalidUser: {
        email: 'invalid@voai.test',
        password: 'WrongPassword123',
    },
};

export const TEST_LEADS = {
    newLead: {
        name: 'João Silva',
        email: 'joao.silva@example.com',
        phone: '+5511999998888',
        destination: 'Paris',
        budget: 'R$ 15.000',
        travelDate: '2025-06-15',
        status: 'CONTATO_INICIAL',
    },
    existingLead: {
        name: 'Maria Santos',
        email: 'maria.santos@example.com',
        phone: '+5511988887777',
        destination: 'Roma',
        budget: 'R$ 20.000',
        travelDate: '2025-07-20',
        status: 'QUALIFICACAO',
    },
};

export const TEST_MESSAGES = {
    simple: 'Olá! Gostaria de informações sobre viagens para Europa.',
    withEmoji: 'Adorei a proposta! 🎉✈️',
    long: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
};

export const TEST_TIMEOUTS = {
    short: 2000,
    medium: 5000,
    long: 10000,
    navigation: 30000,
};

export const ROUTES = {
    home: '/',
    login: '/auth/login',
    dashboard: '/',
    crm: '/crm',
    chat: '/chat',
    inbox: '/inbox',
    roteiros: '/roteiros',
    propostas: '/propostas',
    settings: '/settings',
};

export const SELECTORS = {
    // Auth
    emailInput: 'input[name="email"], input[type="email"]',
    passwordInput: 'input[name="password"], input[type="password"]',
    loginButton: 'button[type="submit"]',
    logoutButton: 'button:has-text("Sair"), button:has-text("Logout")',

    // Dashboard
    dashboardTitle: 'h1, h2',
    metricsCard: '[data-testid="metric-card"]',

    // CRM
    leadCard: '[data-testid="lead-card"]',
    createLeadButton: 'button:has-text("Novo Lead"), button:has-text("Criar Lead")',
    leadNameInput: 'input[name="nome"], input[name="name"]',
    leadEmailInput: 'input[name="email"]',
    saveLeadButton: 'button:has-text("Salvar"), button:has-text("Criar Lead"), button:has-text("Atualizar")',

    // Chat
    chatList: '[data-testid="conversation-list"], [data-testid="chat-list"]',
    chatMessage: '[data-testid="chat-message"], [data-testid="message"]',
    messageInput: '[data-testid="message-input"], textarea[name="message"], input[name="message"]',
    sendButton: '[data-testid="send-button"], button[type="submit"], button:has(svg)',

    // Common
    loadingSpinner: '[data-testid="loading"]',
    toast: '[data-testid="toast"], .toast',
    modal: '[role="dialog"]',
    confirmButton: 'button:has-text("Confirmar")',
    cancelButton: 'button:has-text("Cancelar")',
};
