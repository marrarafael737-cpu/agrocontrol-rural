// AgroControl Rural - Main Application Logic

document.addEventListener('DOMContentLoaded', () => {
    // --- Dark Mode Logic ---
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const sidebarThemeToggleBtn = document.getElementById('sidebar-theme-toggle-btn');

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('agrocontrol_theme', theme);
        
        const themeIconClass = theme === 'dark' ? 'ph ph-sun' : 'ph ph-moon';
        
        if (themeToggleBtn) {
            const icon = themeToggleBtn.querySelector('i');
            if (icon) icon.className = themeIconClass;
        }
        if (sidebarThemeToggleBtn) {
            const icon = sidebarThemeToggleBtn.querySelector('i');
            if (icon) icon.className = themeIconClass;
        }
        
        // Force chart update with new theme grid/text colors if dashboard is active
        if (typeof updateDashboard === 'function' && appScreen && appScreen.classList.contains('active')) {
            updateDashboard();
        }
    }

    function initTheme() {
        const savedTheme = localStorage.getItem('agrocontrol_theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        applyTheme(theme);
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
        });
    }

    if (sidebarThemeToggleBtn) {
        sidebarThemeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
        });
    }

    // Theme will be initialized at the end of DOMContentLoaded

    // --- Mobile Floating Action Button (FAB) ---
    const mobileFabContainer = document.getElementById('mobile-fab-container');
    const fabMainBtn = document.getElementById('fab-main-btn');

    if (fabMainBtn && mobileFabContainer) {
        fabMainBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileFabContainer.classList.toggle('active');
        });
    }

    // Close FAB when clicking anywhere else on the document
    document.addEventListener('click', (e) => {
        if (mobileFabContainer && mobileFabContainer.classList.contains('active')) {
            if (!mobileFabContainer.contains(e.target)) {
                mobileFabContainer.classList.remove('active');
            }
        }
    });

    // --- Skeleton Screens Loader helper ---
    window.triggerSkeleton = function(viewId) {
        const viewElement = document.getElementById(`view-${viewId}`);
        if (!viewElement) return;

        // Check if there is already a skeleton active
        if (viewElement.querySelector('.skeleton-overlay-container')) return;

        let target = viewElement;
        let skeletonHtml = '';

        if (viewId === 'dashboard') {
            skeletonHtml = `
                <div class="skeleton-wrapper" style="padding: 1.5rem;">
                    <div class="cards-grid" style="margin-bottom: 2rem;">
                        <div class="skeleton-item skeleton-card"></div>
                        <div class="skeleton-item skeleton-card"></div>
                        <div class="skeleton-item skeleton-card"></div>
                        <div class="skeleton-item skeleton-card"></div>
                    </div>
                    <div class="dashboard-charts">
                        <div class="skeleton-item skeleton-chart" style="flex: 2; height: 320px;"></div>
                        <div class="skeleton-item skeleton-chart" style="flex: 1; height: 320px;"></div>
                    </div>
                </div>
            `;
        } else if (viewId === 'relatorios') {
            skeletonHtml = `
                <div class="skeleton-wrapper" style="padding: 1.5rem;">
                    <div class="reports-grid">
                        <div class="skeleton-item skeleton-card" style="height: 150px;"></div>
                        <div class="skeleton-item skeleton-card" style="height: 150px;"></div>
                    </div>
                </div>
            `;
        } else {
            skeletonHtml = `
                <div class="skeleton-wrapper" style="padding: 1rem;">
                    <div class="skeleton-item skeleton-table-row" style="height: 40px; margin-bottom: 1.5rem;"></div>
                    <div class="skeleton-item skeleton-table-row"></div>
                    <div class="skeleton-item skeleton-table-row"></div>
                    <div class="skeleton-item skeleton-table-row"></div>
                    <div class="skeleton-item skeleton-table-row"></div>
                    <div class="skeleton-item skeleton-table-row"></div>
                </div>
            `;
            const tableContainer = viewElement.querySelector('.table-container');
            if (tableContainer) {
                target = tableContainer;
            }
        }

        const overlay = document.createElement('div');
        overlay.className = 'skeleton-overlay-container';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'var(--bg-color)';
        overlay.style.zIndex = '10';
        overlay.style.transition = 'opacity 0.2s ease-in-out';
        overlay.style.borderRadius = 'inherit';
        overlay.innerHTML = skeletonHtml;

        const originalPosition = target.style.position;
        target.style.position = 'relative';

        const originalChildren = Array.from(target.children);
        originalChildren.forEach(child => {
            if (child !== overlay) {
                child.style.opacity = '0';
                child.style.transition = 'opacity 0.2s ease-in-out';
            }
        });

        target.appendChild(overlay);

        setTimeout(() => {
            overlay.style.opacity = '0';
            originalChildren.forEach(child => {
                if (child !== overlay) {
                    child.style.opacity = '1';
                }
            });
            
            setTimeout(() => {
                overlay.remove();
                target.style.position = originalPosition;
            }, 200);
        }, 350);
    };

    // --- Loader & Toast Utilities ---
    const loaderOverlay = document.getElementById('loader-overlay');
    const loaderText = document.getElementById('loader-text');
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastMessage = document.getElementById('toast-message');

    function showLoader(show, text = 'Carregando...') {
        // Se estivermos na tela de login, usa o overlay. Se for no App, usa Skeleton.
        if (!appScreen || !appScreen.classList.contains('active')) {
            loaderText.textContent = text;
            if (show) loaderOverlay.classList.add('active');
            else loaderOverlay.classList.remove('active');
        } else {
            const activeView = document.querySelector('.view.active');
            if (show && activeView) {
                activeView.classList.add('loading-view');
            } else if (!show && activeView) {
                activeView.classList.remove('loading-view');
                loaderOverlay.classList.remove('active');
            }
        }
    }

    let toastTimeout = null;
    function showToast(message, type = 'info') {
        if (toastTimeout) clearTimeout(toastTimeout);
        
        toast.className = `toast ${type} active`;
        toastMessage.textContent = message;
        
        // Icon mapping based on type
        if (type === 'success') {
            toastIcon.className = 'ph ph-check-circle toast-icon';
        } else if (type === 'error') {
            toastIcon.className = 'ph ph-x-circle toast-icon';
        } else {
            toastIcon.className = 'ph ph-info toast-icon';
        }

        toastTimeout = setTimeout(() => {
            toast.classList.remove('active');
        }, 4000);
    }

    // --- HTML Escaping Utility (XSS Protection) ---
    function escapeHTML(str) { return String(str).replace(/[&<>'"]/g, function (s) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[s]; }); }

    // PWA e Validações Globais
    // Viagem no Tempo: Limitar inputs de data para não passar de hoje
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        input.setAttribute('max', today);
    });

    // Registrar Service Worker para Offline (PWA) com Estratégia de Atualização
    let refreshing = false;
    
    // Função utilitária de Debounce para otimizar filtros
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js').then(registration => {
                console.log('ServiceWorker registrado com sucesso: ', registration.scope);
                
                registration.onupdatefound = () => {
                    const installingWorker = registration.installing;
                    if (installingWorker == null) return;
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                // Nova atualização disponível
                                showCustomConfirm('Atualização Disponível', 'Uma nova versão do AgroControl foi baixada em segundo plano. Deseja atualizar agora?', false).then(confirmed => {
                                    if (confirmed) {
                                        installingWorker.postMessage('skipWaiting');
                                    }
                                });
                            }
                        }
                    };
                };
            }).catch(err => {
                console.log('Falha no registro do ServiceWorker: ', err);
            });

            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            });
        });
    }

    // Monitora Queda de Sessão Silenciosa
    window.addEventListener('auth-expired', (e) => {
        const count = e.detail && e.detail.count ? e.detail.count : 'várias';
        const loader = document.getElementById('loader-overlay');
        if (loader) loader.style.display = 'none';

        alert(`⚠ ATENÇÃO CRÍTICA ⚠\n\nSua sessão expirou por motivo de segurança!\nExistem ${count} alterações presas no seu celular aguardando envio.\n\nFAÇA LOGIN NOVAMENTE AGORA MESMO PARA NÃO PERDER SEUS DADOS!`);
        
        DB.signOut().then(() => {
            document.getElementById('app-screen').classList.remove('active');
            document.getElementById('login-screen').classList.add('active');
        });
    });

    // --- Custom Confirmation Dialog Utility ---
    window.showCustomConfirm = function(title, message, isDanger = false) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('confirm-modal-overlay');
            const iconContainer = document.getElementById('confirm-modal-icon-container');
            const icon = document.getElementById('confirm-modal-icon');
            const titleEl = document.getElementById('confirm-modal-title');
            const messageEl = document.getElementById('confirm-modal-message');
            const cancelBtn = document.getElementById('confirm-modal-cancel-btn');
            const confirmBtn = document.getElementById('confirm-modal-confirm-btn');

            titleEl.textContent = title;
            messageEl.textContent = message;

            if (isDanger) {
                iconContainer.className = 'confirm-modal-icon-container danger-theme';
                icon.className = 'ph ph-warning-circle';
                confirmBtn.className = 'confirm-btn confirm-btn-confirm danger-theme';
                confirmBtn.textContent = 'Excluir';
            } else {
                iconContainer.className = 'confirm-modal-icon-container primary-theme';
                icon.className = 'ph ph-question';
                confirmBtn.className = 'confirm-btn confirm-btn-confirm primary-theme';
                confirmBtn.textContent = 'Confirmar';
            }

            overlay.classList.add('active');

            function handleConfirm() {
                cleanup();
                resolve(true);
            }

            function handleCancel() {
                cleanup();
                resolve(false);
            }

            function handleOverlayClick(e) {
                if (e.target === overlay) {
                    handleCancel();
                }
            }

            function cleanup() {
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
                overlay.removeEventListener('click', handleOverlayClick);
                overlay.classList.remove('active');
            }

            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
            overlay.addEventListener('click', handleOverlayClick);
        });
    };

    // --- Login & Auth ---
    const loginForm = document.getElementById('login-form');
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    const logoutBtn = document.getElementById('logout-btn');
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    const toggleAuthMode = document.getElementById('toggle-auth-mode');
    const authToggleContainer = document.getElementById('auth-toggle-container');
    const loginDemoBtn = document.getElementById('login-demo-btn');
    const connectionStatusBadge = document.getElementById('connection-status-badge');
    const userDisplayName = document.getElementById('user-display-name');

    let authMode = 'login'; // 'login' ou 'signup'

    // Alternar entre login e cadastro
    // Usa delegação de eventos no container para evitar referências quebradas após innerHTML rewrite
    authToggleContainer.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        e.preventDefault();
        if (authMode === 'login') {
            authMode = 'signup';
            loginSubmitBtn.textContent = 'Criar Conta';
            authToggleContainer.innerHTML = 'Já tem uma conta? <a href="#" style="color: var(--primary); font-weight: 600; text-decoration: none;">Entre</a>';
        } else {
            authMode = 'login';
            loginSubmitBtn.textContent = 'Entrar';
            authToggleContainer.innerHTML = 'Não tem uma conta? <a href="#" style="color: var(--primary); font-weight: 600; text-decoration: none;">Cadastre-se</a>';
        }
    });

    // Entrar no Modo de Demonstração (Offline)
    loginDemoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        localStorage.setItem('agrocontrol_auth', 'true');
        localStorage.setItem('agrocontrol_auth_mode', 'offline');
        
        connectionStatusBadge.className = 'badge-offline';
        connectionStatusBadge.innerHTML = '<i class="ph ph-circle"></i> Offline (Demo)';
        userDisplayName.textContent = 'Modo Demo';

        // Mostra o App com Skeleton Loader em vez de tela preta
        showApp();
        const dashView = document.getElementById('view-dashboard');
        dashView.classList.add('loading-view');

        setTimeout(() => {
            dashView.classList.remove('loading-view');
            showToast('Entrou no Modo de Demonstração (Offline)', 'info');
        }, 800);
    });

    // Enviar formulário de Auth (Login / Cadastro)
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (authMode === 'login') {
            showLoader(true, 'Entrando...');
            try {
                const data = await DB.signIn(email, password);
                localStorage.setItem('agrocontrol_auth', 'true');
                localStorage.setItem('agrocontrol_auth_mode', 'online');
                
                connectionStatusBadge.className = 'badge-online';
                connectionStatusBadge.innerHTML = '<i class="ph ph-circle-wavy-check"></i> Conectado';
                userDisplayName.textContent = email;

                showToast('Login realizado com sucesso!', 'success');
                showApp();
            } catch (err) {
                console.error("Erro no login:", err);
                showToast(err.message || 'Erro ao realizar login.', 'error');
            } finally {
                showLoader(false);
            }
        } else {
            showLoader(true, 'Criando sua conta...');
            try {
                await DB.signUp(email, password);
                showToast('Conta criada! Verifique seu e-mail para confirmar o cadastro.', 'success');
                // Alterna de volta para login
                toggleAuthMode.click();
            } catch (err) {
                console.error("Erro no cadastro:", err);
                showToast(err.message || 'Erro ao criar conta.', 'error');
            } finally {
                showLoader(false);
            }
        }
    });

    // Sair (Logout)
    logoutBtn.addEventListener('click', async () => {
        showLoader(true, 'Saindo...');
        try {
            await DB.signOut();
            appScreen.classList.remove('active');
            loginScreen.classList.add('active');
            showToast('Você saiu do sistema.', 'info');
        } catch (err) {
            console.error("Erro no logout:", err);
        } finally {
            showLoader(false);
        }
    });

    // Verificar login existente ao iniciar
    async function initAuth() {
        if (localStorage.getItem('agrocontrol_auth') === 'true') {
            const mode = localStorage.getItem('agrocontrol_auth_mode') || 'offline';
            
            if (mode === 'online') {
                showApp();
                const dashView = document.getElementById('view-dashboard');
                dashView.classList.add('loading-view');
                
                try {
                    const authenticated = await DB.isAuthenticated();
                    if (authenticated) {
                        await DB.syncFromSupabase();
                        const user = await DB.getUser();
                        
                        connectionStatusBadge.className = 'badge-online';
                        connectionStatusBadge.innerHTML = '<i class="ph ph-circle-wavy-check"></i> Conectado';
                        userDisplayName.textContent = user ? user.email : 'Fazenda São José';
                        
                        updateDashboard();
                        loadViewsData();
                    } else {
                        await DB.signOut();
                        loginScreen.classList.add('active');
                        appScreen.classList.remove('active');
                        showToast('Sua sessão expirou.', 'info');
                    }
                } catch (err) {
                    console.error("Erro ao validar sessão:", err);
                    connectionStatusBadge.className = 'badge-offline';
                    connectionStatusBadge.innerHTML = '<i class="ph ph-circle"></i> Offline (Erro)';
                    updateDashboard();
                    loadViewsData();
                } finally {
                    dashView.classList.remove('loading-view');
                }
            } else {
                connectionStatusBadge.className = 'badge-offline';
                connectionStatusBadge.innerHTML = '<i class="ph ph-circle"></i> Offline (Demo)';
                userDisplayName.textContent = 'Modo Demo';
                showApp();
            }
        }
    }

    function showApp() {
        loginScreen.classList.remove('active');
        appScreen.classList.add('active');
        
        // Trigger skeleton screen loader animation for the dashboard on initial entry
        if (typeof window.triggerSkeleton === 'function') {
            window.triggerSkeleton('dashboard');
        }
        
        // Timeout garante que o display: flex foi aplicado antes de renderizar os gráficos (evita bug de tamanho 0)
        setTimeout(() => {
            updateDashboard();
            loadViewsData();
        }, 50);
    }

    // Executa validação de auth na inicialização
    if (window.dbReadyPromise) {
        window.dbReadyPromise.then(() => {
            initAuth();
        });
    } else {
        initAuth();
    }

    // --- Navigation ---
    const navItems = document.querySelectorAll('.nav-item[data-view]');
    const views = document.querySelectorAll('.view');
    const topbarTitle = document.getElementById('topbar-title');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const openSidebarBtn = document.getElementById('open-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const viewId = item.getAttribute('data-view');
            
            // Trigger skeleton screen loader animation
            if (typeof window.triggerSkeleton === 'function') {
                window.triggerSkeleton(viewId);
            }

            // Remove active from all
            navItems.forEach(nav => nav.classList.remove('active'));
            views.forEach(view => view.classList.remove('active'));

            // Add active to clicked
            item.classList.add('active');
            document.getElementById(`view-${viewId}`).classList.add('active');
            
            // Update title
            topbarTitle.textContent = item.textContent.trim();

            // Mobile: close sidebar on click
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
                sidebarOverlay.classList.remove('active');
            }

            // Refresh data if needed
            if (viewId === 'dashboard') updateDashboard();
            if (viewId === 'contas') renderContas();
            if (viewId === 'mapa') {
                if (typeof window.initMap === 'function') window.initMap();
            }
        });
    });

    openSidebarBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('active');
    });
    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    });
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    });

    // --- Modals ---
    window.openModal = function(modalId) {
        document.getElementById('modal-overlay').classList.add('active');
        document.getElementById(modalId).classList.add('active');
    };

    window.closeModal = function() {
        document.getElementById('modal-overlay').classList.remove('active');
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        // Reset forms and buttons
        document.querySelectorAll('form').forEach(f => {
            if(f.id !== 'login-form') f.reset();
            // Clear hidden IDs
            const hiddenId = f.querySelector('input[type="hidden"]');
            if(hiddenId) hiddenId.value = '';
            // Re-enable submit buttons
            const btnSubmit = f.querySelector('button[type="submit"]');
            if(btnSubmit) {
                btnSubmit.disabled = false;
                if(btnSubmit.id === 'btn-salvar-gado') btnSubmit.textContent = 'Salvar Animal';
            }
        });
    };

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    document.getElementById('modal-overlay').addEventListener('click', closeModal);

    // --- Data Rendering & Forms ---
    
    function loadViewsData() {
        renderDespesas();
        renderReceitas();
        renderGado();
        renderBezerros();
        renderContas();
    }

    // Despesas
    const formDespesa = document.getElementById('form-despesa');
    formDespesa.addEventListener('submit', (e) => {
        e.preventDefault();
        const valorInput = parseFloat(document.getElementById('despesa-valor').value);
        if (valorInput <= 0) {
            showToast('Erro: O valor deve ser maior que zero.', 'error');
            return;
        }

        const btnSalvar = e.target.querySelector('button[type="submit"]');
        if (btnSalvar) btnSalvar.disabled = true;
        
        const id = document.getElementById('despesa-id').value;
        const despesa = {
            categoria: document.getElementById('despesa-categoria').value,
            descricao: document.getElementById('despesa-descricao').value,
            valor: document.getElementById('despesa-valor').value,
            data: document.getElementById('despesa-data').value,
            observacoes: document.getElementById('despesa-observacoes').value
        };

        if (id) {
            DB.updateDespesa(id, despesa);
        } else {
            DB.addDespesa(despesa);
        }
        
        closeModal();
        renderDespesas();
        updateDashboard();
    });

    function renderDespesas(filter = '') {
        const tbody = document.getElementById('table-despesas-body');
        const emptyState = document.getElementById('empty-despesas');
        let despesas = DB.getDespesas().sort((a,b) => new Date(b.data) - new Date(a.data));

        if (filter) {
            despesas = despesas.filter(d => 
                d.descricao.toLowerCase().includes(filter.toLowerCase()) || 
                d.categoria.toLowerCase().includes(filter.toLowerCase())
            );
        }

        window.tablePagination = window.tablePagination || {};
        window.tablePagination.despesas = window.tablePagination.despesas || 50;
        const limit = window.tablePagination.despesas;
        const paginatedDespesas = despesas.slice(0, limit);

        tbody.innerHTML = '';
        if (despesas.length === 0) {
            emptyState.style.display = 'block';
            tbody.parentElement.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            tbody.parentElement.style.display = 'table';
            paginatedDespesas.forEach(d => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td data-label="Data">${formatDate(d.data)}</td>
                    <td data-label="Descrição"><strong>${d.descricao}</strong></td>
                    <td data-label="Categoria">${d.categoria}</td>
                    <td data-label="Valor" style="color: var(--danger); font-weight: 500;">${formatCurrency(d.valor)}</td>
                    <td data-label="Ações" class="table-actions">
                        <button class="icon-btn clone" title="Copiar" onclick="cloneDespesa('${d.id}')"><i class="ph ph-copy"></i></button>
                        <button class="icon-btn edit" title="Editar" onclick="editDespesa('${d.id}')"><i class="ph ph-pencil-simple"></i></button>
                        <button class="icon-btn delete" title="Excluir" onclick="deleteDespesa('${d.id}')"><i class="ph ph-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            if (despesas.length > limit) {
                const trBtn = document.createElement('tr');
                trBtn.innerHTML = `<td colspan="8" style="text-align:center; padding: 15px;"><button type="button" class="btn btn-secondary" onclick="window.tablePagination.despesas += 50; renderDespesas(document.getElementById('search-despesa').value)">Carregar Mais 50 (${despesas.length - limit} restantes)</button></td>`;
                tbody.appendChild(trBtn);
            }
        }
    }

    window.editDespesa = (id) => {
        const d = DB.getDespesas().find(x => x.id === id);
        if(!d) return;
        document.getElementById('despesa-id').value = d.id;
        document.getElementById('despesa-categoria').value = d.categoria;
        document.getElementById('despesa-descricao').value = d.descricao;
        document.getElementById('despesa-valor').value = d.valor;
        document.getElementById('despesa-data').value = d.data;
        document.getElementById('despesa-observacoes').value = d.observacoes;
        openModal('modal-despesa');
    };

    window.cloneDespesa = (id) => {
        const d = DB.getDespesas().find(x => x.id === id);
        if(!d) return;
        document.getElementById('despesa-id').value = ''; // Empty ID to create new
        document.getElementById('despesa-categoria').value = d.categoria;
        document.getElementById('despesa-descricao').value = d.descricao + ' (Cópia)';
        document.getElementById('despesa-valor').value = d.valor;
        document.getElementById('despesa-data').value = d.data; // Mantém a data original
        document.getElementById('despesa-observacoes').value = d.observacoes || '';
        openModal('modal-despesa');
        showToast('Despesa copiada. Ajuste a data e salve.', 'info');
    };

    window.deleteDespesa = async (id) => {
        const confirmed = await showCustomConfirm('Excluir Despesa', 'Tem certeza que deseja excluir esta despesa?', true);
        if(confirmed) {
            DB.deleteDespesa(id);
            renderDespesas();
            updateDashboard();
            showToast('Despesa excluída com sucesso.', 'success');
        }
    };

    document.getElementById('search-despesa').addEventListener('input', debounce((e) => {
        window.tablePagination.despesas = 50;
        renderDespesas(e.target.value);
    }, 300));

    // Receitas
    const formReceita = document.getElementById('form-receita');
    formReceita.addEventListener('submit', (e) => {
        e.preventDefault();
        const valorInput = parseFloat(document.getElementById('receita-valor').value);
        if (valorInput <= 0) {
            showToast('Erro: O valor deve ser maior que zero.', 'error');
            return;
        }

        const btnSalvar = e.target.querySelector('button[type="submit"]');
        if (btnSalvar) btnSalvar.disabled = true;
        
        const id = document.getElementById('receita-id').value;
        const receita = {
            tipo: document.getElementById('receita-tipo').value,
            qtd: document.getElementById('receita-qtd').value,
            peso: document.getElementById('receita-peso').value,
            valor: document.getElementById('receita-valor').value,
            data: document.getElementById('receita-data').value,
            observacoes: document.getElementById('receita-observacoes').value
        };

        if (id) {
            DB.updateReceita(id, receita);
        } else {
            DB.addReceita(receita);
        }
        
        closeModal();
        renderReceitas();
        updateDashboard();
    });

    function renderReceitas(filter = '') {
        const tbody = document.getElementById('table-receitas-body');
        const emptyState = document.getElementById('empty-receitas');
        let receitas = DB.getReceitas().sort((a,b) => new Date(b.data) - new Date(a.data));

        if (filter) {
            receitas = receitas.filter(r => r.tipo.toLowerCase().includes(filter.toLowerCase()));
        }

        window.tablePagination = window.tablePagination || {};
        window.tablePagination.receitas = window.tablePagination.receitas || 50;
        const limit = window.tablePagination.receitas;
        const paginatedReceitas = receitas.slice(0, limit);

        tbody.innerHTML = '';
        if (receitas.length === 0) {
            emptyState.style.display = 'block';
            tbody.parentElement.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            tbody.parentElement.style.display = 'table';
            paginatedReceitas.forEach(r => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td data-label="Data">${formatDate(r.data)}</td>
                    <td data-label="Descrição"><strong>${r.tipo}</strong></td>
                    <td data-label="Qtd. Animais">${r.qtd} cb</td>
                    <td data-label="Valor Total" style="color: var(--success); font-weight: 500;">${formatCurrency(r.valor)}</td>
                    <td data-label="Ações" class="table-actions">
                        <button class="icon-btn clone" title="Copiar" onclick="cloneReceita('${r.id}')"><i class="ph ph-copy"></i></button>
                        <button class="icon-btn edit" title="Editar" onclick="editReceita('${r.id}')"><i class="ph ph-pencil-simple"></i></button>
                        <button class="icon-btn delete" title="Excluir" onclick="deleteReceita('${r.id}')"><i class="ph ph-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            if (receitas.length > limit) {
                const trBtn = document.createElement('tr');
                trBtn.innerHTML = `<td colspan="8" style="text-align:center; padding: 15px;"><button type="button" class="btn btn-secondary" onclick="window.tablePagination.receitas += 50; renderReceitas(document.getElementById('search-receita').value)">Carregar Mais 50 (${receitas.length - limit} restantes)</button></td>`;
                tbody.appendChild(trBtn);
            }
        }
    }

    window.editReceita = (id) => {
        const r = DB.getReceitas().find(x => x.id === id);
        if(!r) return;
        document.getElementById('receita-id').value = r.id;
        document.getElementById('receita-tipo').value = r.tipo;
        document.getElementById('receita-qtd').value = r.qtd;
        document.getElementById('receita-peso').value = r.peso;
        document.getElementById('receita-valor').value = r.valor;
        document.getElementById('receita-data').value = r.data;
        document.getElementById('receita-observacoes').value = r.observacoes;
        openModal('modal-receita');
    };

    window.cloneReceita = (id) => {
        const r = DB.getReceitas().find(x => x.id === id);
        if(!r) return;
        document.getElementById('receita-id').value = ''; // New
        document.getElementById('receita-tipo').value = r.tipo;
        document.getElementById('receita-qtd').value = r.qtd;
        document.getElementById('receita-peso').value = r.peso || '';
        document.getElementById('receita-valor').value = r.valor;
        document.getElementById('receita-data').value = r.data;
        document.getElementById('receita-observacoes').value = r.observacoes || '';
        openModal('modal-receita');
        showToast('Receita copiada. Ajuste a data e salve.', 'info');
    };

    window.deleteReceita = async (id) => {
        const confirmed = await showCustomConfirm('Excluir Receita', 'Tem certeza que deseja excluir esta receita?', true);
        if(confirmed) {
            DB.deleteReceita(id);
            renderReceitas();
            updateDashboard();
            showToast('Receita excluída com sucesso.', 'success');
        }
    };
    
    document.getElementById('search-receita').addEventListener('input', debounce((e) => {
        window.tablePagination.receitas = 50;
        renderReceitas(e.target.value);
    }, 300));



    // Gado
    const formGado = document.getElementById('form-gado');
    
    // Elementos do Cadastro em Lote
    const tabIndividual = document.getElementById('tab-cadastro-individual');
    const tabLote = document.getElementById('tab-cadastro-lote');
    const individualFields = document.getElementById('individual-fields');
    const loteFields = document.getElementById('lote-fields');
    const gadoCadastroModo = document.getElementById('gado-cadastro-modo');
    const gadoBrinco = document.getElementById('gado-brinco');
    const gadoSexo = document.getElementById('gado-sexo');
    
    const gadoLoteSexo = document.getElementById('gado-lote-sexo');
    const gadoLoteMistoDist = document.getElementById('gado-lote-misto-dist');
    const gadoLoteQtdFemeas = document.getElementById('gado-lote-qtd-femeas');
    const gadoLoteQtdMachos = document.getElementById('gado-lote-qtd-machos');
    
    const gadoLoteFinanceiro = document.getElementById('gado-lote-financeiro');
    const gadoLoteFinanceDetails = document.getElementById('gado-lote-finance-details');
    const gadoLoteValorUnitario = document.getElementById('gado-lote-valor-unitario');
    const gadoLoteQtd = document.getElementById('gado-lote-qtd');
    const gadoLoteValorTotal = document.getElementById('gado-lote-valor-total');

    function switchGadoCadastroMode(modo) {
        if (modo === 'individual') {
            if (tabIndividual) {
                tabIndividual.classList.add('active');
                tabIndividual.style.background = 'white';
                tabIndividual.style.color = 'var(--primary)';
            }
            if (tabLote) {
                tabLote.classList.remove('active');
                tabLote.style.background = 'transparent';
                tabLote.style.color = 'var(--text-muted)';
            }
            if (individualFields) individualFields.style.display = 'block';
            if (loteFields) loteFields.style.display = 'none';
            if (gadoCadastroModo) gadoCadastroModo.value = 'individual';
            
            if (gadoBrinco) gadoBrinco.setAttribute('required', 'true');
            if (gadoSexo) gadoSexo.setAttribute('required', 'true');
        } else {
            if (tabLote) {
                tabLote.classList.add('active');
                tabLote.style.background = 'white';
                tabLote.style.color = 'var(--primary)';
            }
            if (tabIndividual) {
                tabIndividual.classList.remove('active');
                tabIndividual.style.background = 'transparent';
                tabIndividual.style.color = 'var(--text-muted)';
            }
            if (individualFields) individualFields.style.display = 'none';
            if (loteFields) loteFields.style.display = 'block';
            if (gadoCadastroModo) gadoCadastroModo.value = 'lote';
            
            if (gadoBrinco) gadoBrinco.removeAttribute('required');
            if (gadoSexo) gadoSexo.removeAttribute('required');
        }
    }

    if (tabIndividual && tabLote) {
        tabIndividual.addEventListener('click', () => switchGadoCadastroMode('individual'));
        tabLote.addEventListener('click', () => switchGadoCadastroMode('lote'));
    }

    if (gadoLoteSexo) {
        gadoLoteSexo.addEventListener('change', () => {
            if (gadoLoteSexo.value === 'Misto') {
                if (gadoLoteMistoDist) gadoLoteMistoDist.style.display = 'flex';
                if (gadoLoteQtdFemeas) gadoLoteQtdFemeas.setAttribute('required', 'true');
                if (gadoLoteQtdMachos) gadoLoteQtdMachos.setAttribute('required', 'true');
            } else {
                if (gadoLoteMistoDist) gadoLoteMistoDist.style.display = 'none';
                if (gadoLoteQtdFemeas) gadoLoteQtdFemeas.removeAttribute('required');
                if (gadoLoteQtdMachos) gadoLoteQtdMachos.removeAttribute('required');
            }
        });
    }

    if (gadoLoteFinanceiro) {
        gadoLoteFinanceiro.addEventListener('change', () => {
            if (gadoLoteFinanceiro.checked) {
                if (gadoLoteFinanceDetails) gadoLoteFinanceDetails.style.display = 'flex';
                if (gadoLoteValorUnitario) gadoLoteValorUnitario.setAttribute('required', 'true');
            } else {
                if (gadoLoteFinanceDetails) gadoLoteFinanceDetails.style.display = 'none';
                if (gadoLoteValorUnitario) gadoLoteValorUnitario.removeAttribute('required');
            }
        });
    }

    function calcularValorTotalLote() {
        if (gadoLoteQtd && gadoLoteValorUnitario && gadoLoteValorTotal) {
            const qtd = parseInt(gadoLoteQtd.value) || 0;
            const unitario = parseFloat(gadoLoteValorUnitario.value) || 0;
            gadoLoteValorTotal.value = (qtd * unitario).toFixed(2);
        }
    }

    if (gadoLoteQtd && gadoLoteValorUnitario) {
        gadoLoteQtd.addEventListener('input', calcularValorTotalLote);
        gadoLoteValorUnitario.addEventListener('input', calcularValorTotalLote);
    }

    formGado.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const btnSalvar = document.getElementById('btn-salvar-gado');
        if (btnSalvar) {
            btnSalvar.disabled = true;
            btnSalvar.textContent = 'Salvando...';
        }
        
        const modo = gadoCadastroModo ? gadoCadastroModo.value : 'individual';
        
        if (modo === 'individual') {
            const id = document.getElementById('gado-id').value;
            const brincoInput = document.getElementById('gado-brinco').value.trim();
            
            // Validação de Brinco Único
            const existeBrinco = DB.getGado().find(g => g.brinco.toLowerCase() === brincoInput.toLowerCase() && g.id !== id);
            if (existeBrinco) {
                showToast('Erro: Já existe um animal com este Brinco/ID.', 'error');
                if (btnSalvar) {
                    btnSalvar.disabled = false;
                    btnSalvar.textContent = 'Salvar Animal';
                }
                return;
            }

            const animal = {
                brinco: brincoInput,
                lote: document.getElementById('gado-lote').value,
                sexo: document.getElementById('gado-sexo').value,
                nascimento: document.getElementById('gado-nascimento').value,
                peso: document.getElementById('gado-peso').value,
                situacao: document.getElementById('gado-situacao').value
            };

            if (id) {
                const oldAnimal = DB.getGado().find(g => g.id === id);
                DB.updateGado(id, animal);
                
                if (oldAnimal && oldAnimal.situacao !== 'Vendido' && animal.situacao === 'Vendido') {
                    const valorVenda = window.prompt("O animal foi marcado como Vendido! Qual o valor da venda (R$)?", "0.00");
                    if (valorVenda !== null && parseFloat(valorVenda) > 0) {
                        DB.addReceita({
                            tipo: 'Venda de Animais',
                            qtd: 1,
                            peso: animal.peso,
                            valor: parseFloat(valorVenda),
                            data: new Date().toISOString().split('T')[0],
                            observacoes: `Venda do animal Brinco: ${animal.brinco}`
                        });
                        showToast('Animal atualizado e Receita gerada!', 'success');
                    } else {
                        showToast('Animal vendido (Sem receita gerada).', 'warning');
                    }
                } else if (oldAnimal && oldAnimal.situacao !== 'Morto' && animal.situacao === 'Morto') {
                    const valorPrejuizo = window.prompt("O animal foi marcado como Morto. Qual o prejuízo estimado (R$)?", "0.00");
                    if (valorPrejuizo !== null && parseFloat(valorPrejuizo) > 0) {
                        DB.addDespesa({
                            categoria: 'Outros',
                            descricao: 'Prejuízo Patrimonial (Morte)',
                            valor: parseFloat(valorPrejuizo),
                            data: new Date().toISOString().split('T')[0],
                            observacoes: `Morte do animal Brinco: ${animal.brinco}`
                        });
                        showToast('Animal atualizado e Despesa/Prejuízo gerada!', 'warning');
                    } else {
                        showToast('Animal atualizado para Morto.', 'success');
                    }
                } else {
                    showToast('Animal atualizado com sucesso!', 'success');
                }
            } else {
                DB.addGado(animal);
                showToast('Animal cadastrado com sucesso!', 'success');
            }
        } else {
            // Cadastro em Lote
            const qtd = parseInt(gadoLoteQtd.value) || 0;
            const loteNome = document.getElementById('gado-lote-nome').value.trim();
            const sexoLote = gadoLoteSexo.value;
            const idadeMeses = parseInt(document.getElementById('gado-lote-idade-meses').value);
            const pesoMedio = document.getElementById('gado-lote-peso').value;
            const situacaoLote = document.getElementById('gado-lote-situacao').value;

            if (qtd <= 0) {
                showToast('A quantidade de cabeças deve ser maior que zero.', 'error');
                return;
            }

            let countFemeas = 0;
            let countMachos = 0;
            let qtdFemeas = 0;
            let qtdMachos = 0;

            if (sexoLote === 'Misto') {
                qtdFemeas = parseInt(gadoLoteQtdFemeas.value) || 0;
                qtdMachos = parseInt(gadoLoteQtdMachos.value) || 0;
                
                if (qtdFemeas + qtdMachos !== qtd) {
                    showToast('A soma de fêmeas e machos deve ser igual à quantidade total de cabeças.', 'error');
                    return;
                }
            }

            // Calcular data de nascimento aproximada
            let nascimentoStr = '';
            if (!isNaN(idadeMeses) && idadeMeses >= 0) {
                const d = new Date();
                d.setMonth(d.getMonth() - idadeMeses);
                nascimentoStr = d.toISOString().split('T')[0];
            }

            // Salva cada animal em lote
            for (let i = 0; i < qtd; i++) {
                let animalSexo = 'Fêmea';
                if (sexoLote === 'Fêmea') {
                    animalSexo = 'Fêmea';
                } else if (sexoLote === 'Macho') {
                    animalSexo = 'Macho';
                } else {
                    // Misto
                    if (countFemeas < qtdFemeas) {
                        animalSexo = 'Fêmea';
                        countFemeas++;
                    } else {
                        animalSexo = 'Macho';
                        countMachos++;
                    }
                }

                // Brinco sequencial: LOTE-Nome-1
                const loteLabel = loteNome || 'Lote';
                const brincoTag = `LOTE-${loteLabel}-${i + 1}`;

                DB.addGado({
                    brinco: brincoTag,
                    lote: loteNome || 'Sem lote',
                    sexo: animalSexo,
                    nascimento: nascimentoStr,
                    peso: pesoMedio,
                    situacao: situacaoLote || 'Ativo no Pasto'
                });
            }

            // Registrar despesa automática se aplicável
            const registrarFinanceiro = gadoLoteFinanceiro ? gadoLoteFinanceiro.checked : false;
            if (registrarFinanceiro) {
                const valUnit = parseFloat(gadoLoteValorUnitario.value);
                if (valUnit <= 0 || isNaN(valUnit)) {
                    showToast('Erro: Valor unitário inválido.', 'error');
                    if (btnSalvar) {
                        btnSalvar.disabled = false;
                        btnSalvar.textContent = 'Salvar Animal';
                    }
                    return;
                }
                const valorTotal = parseFloat(gadoLoteValorTotal.value) || 0;
                if (valorTotal > 0) {
                    DB.addDespesa({
                        categoria: 'Outros',
                        descricao: `Compra de Lote: ${qtd} cabeças (${loteNome || 'Gado'})`,
                        valor: valorTotal,
                        data: new Date().toISOString().split('T')[0],
                        observacoes: `Compra automática de lote de gado. Quantidade: ${qtd} cabeças (${sexoLote === 'Misto' ? `${qtdFemeas} F / ${qtdMachos} M` : sexoLote}). Peso Médio: ${pesoMedio ? pesoMedio + ' kg' : '-'}. Idade estimada: ${idadeMeses ? idadeMeses + ' meses' : '-'}.`
                    });
                }
            }

            showToast(`${qtd} cabeças de gado cadastradas com sucesso!`, 'success');
        }
        
        closeModal();
        renderGado();
        renderDespesas();
        updateDashboard();
        
        setTimeout(() => {
            if (btnSalvar) {
                btnSalvar.disabled = false;
                btnSalvar.textContent = 'Salvar Animal';
            }
        }, 500);
    });

    function renderGado(filter = '') {
        const tbody = document.getElementById('table-gado-body');
        const emptyState = document.getElementById('empty-gado');
        let gado = DB.getGado();

        if (filter) {
            gado = gado.filter(g => 
                g.brinco.toLowerCase().includes(filter.toLowerCase()) || 
                (g.lote && g.lote.toLowerCase().includes(filter.toLowerCase()))
            );
        }

        window.tablePagination = window.tablePagination || {};
        window.tablePagination.gado = window.tablePagination.gado || 50;
        const limit = window.tablePagination.gado;
        const paginatedGado = gado.slice(0, limit);

        tbody.innerHTML = '';
        if (gado.length === 0) {
            emptyState.style.display = 'block';
            tbody.parentElement.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            tbody.parentElement.style.display = 'table';
            paginatedGado.forEach(g => {
                const tr = document.createElement('tr');
                const safeBrinco = escapeHTML(g.brinco);
                const safeLote = escapeHTML(g.lote || '-');
                tr.innerHTML = `
                    <td data-label="Selecionar"><input type="checkbox" class="gado-checkbox table-checkbox" value="${g.id}"></td>
                    <td data-label="ID / Brinco"><strong>${safeBrinco}</strong></td>
                    <td data-label="Sexo">${g.sexo}</td>
                    <td data-label="Nascimento">${formatDate(g.nascimento)}</td>
                    <td data-label="Peso (kg)">${g.peso ? g.peso + ' kg' : '-'}</td>
                    <td data-label="Lote">${safeLote}</td>
                    <td data-label="Situação"><span style="padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; background: #e9ecef;">${g.situacao}</span></td>
                    <td data-label="Ações" class="table-actions">
                        <button class="icon-btn edit" onclick="editGado('${g.id}')"><i class="ph ph-pencil-simple"></i></button>
                        <button class="icon-btn delete" onclick="deleteGado('${g.id}')"><i class="ph ph-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            if (gado.length > limit) {
                const trBtn = document.createElement('tr');
                trBtn.innerHTML = `<td colspan="8" style="text-align:center; padding: 15px;"><button type="button" class="btn btn-secondary" onclick="window.tablePagination.gado += 50; document.getElementById('search-gado').dispatchEvent(new Event('input'))">Carregar Mais 50 (${gado.length - limit} restantes)</button></td>`;
                tbody.appendChild(trBtn);
            }
        }
        updateBulkActionBar('gado');
    }

    window.editGado = (id) => {
        const g = DB.getGado().find(x => x.id === id);
        if(!g) return;
        // Preenche campos ANTES de abrir o modal
        // Esconde abas de lote ao editar
        const tabsDiv = document.querySelector('#modal-gado .modal-tabs');
        if (tabsDiv) tabsDiv.style.display = 'none';
        switchGadoCadastroMode('individual');
        // Garante que campos mistos/financeiros ocultos estejam escondidos
        const mistoDist = document.getElementById('gado-lote-misto-dist');
        const financeDetails = document.getElementById('gado-lote-finance-details');
        if (mistoDist) mistoDist.style.display = 'none';
        if (financeDetails) financeDetails.style.display = 'none';
        // Usa originalOpenModal para não limpar o gado-id
        originalOpenModal('modal-gado');
        // Define valores após abrir o modal
        document.getElementById('gado-id').value = g.id;
        document.getElementById('gado-brinco').value = g.brinco;
        document.getElementById('gado-lote').value = g.lote || '';
        document.getElementById('gado-sexo').value = g.sexo;
        document.getElementById('gado-nascimento').value = g.nascimento || '';
        document.getElementById('gado-peso').value = g.peso || '';
        document.getElementById('gado-situacao').value = g.situacao;
    };

    window.deleteGado = async (id) => {
        const confirmed = await showCustomConfirm('Excluir Animal', 'Tem certeza que deseja excluir este animal?', true);
        if(confirmed) {
            DB.deleteGado(id);
            renderGado();
            updateDashboard();
            showToast('Animal excluído com sucesso do rebanho.', 'success');
        }
    };
    
    document.getElementById('search-gado').addEventListener('input', debounce((e) => {
        window.tablePagination.gado = 50;
        renderGado(e.target.value);
    }, 300));

    // Bezerros
    const formBezerro = document.getElementById('form-bezerro');
    const bezerroSexo = document.getElementById('bezerro-sexo');
    const bezerroMistoDist = document.getElementById('bezerro-misto-dist');
    const bezerroQtdFemeas = document.getElementById('bezerro-qtd-femeas');
    const bezerroQtdMachos = document.getElementById('bezerro-qtd-machos');

    if (bezerroSexo) {
        bezerroSexo.addEventListener('change', () => {
            if (bezerroSexo.value === 'Misto') {
                if (bezerroMistoDist) bezerroMistoDist.style.display = 'flex';
                if (bezerroQtdFemeas) bezerroQtdFemeas.setAttribute('required', 'true');
                if (bezerroQtdMachos) bezerroQtdMachos.setAttribute('required', 'true');
            } else {
                if (bezerroMistoDist) bezerroMistoDist.style.display = 'none';
                if (bezerroQtdFemeas) bezerroQtdFemeas.removeAttribute('required');
                if (bezerroQtdMachos) bezerroQtdMachos.removeAttribute('required');
            }
        });
    }

    // Lógica Financeira Bezerro
    const bezerroFinanceiro = document.getElementById('bezerro-financeiro');
    const bezerroFinanceDetails = document.getElementById('bezerro-finance-details');
    const bezerroValorUnitario = document.getElementById('bezerro-valor-unitario');
    const bezerroValorTotal = document.getElementById('bezerro-valor-total');
    const bezerroQtdInput = document.getElementById('bezerro-qtd');

    function updateBezerroValorTotal() {
        if (!bezerroFinanceiro || !bezerroFinanceiro.checked) return;
        const qtd = parseInt(bezerroQtdInput.value) || 1;
        const unit = parseFloat(bezerroValorUnitario.value) || 0;
        if (bezerroValorTotal) {
            bezerroValorTotal.value = (qtd * unit).toFixed(2);
        }
    }

    if (bezerroFinanceiro) {
        bezerroFinanceiro.addEventListener('change', (e) => {
            if (e.target.checked) {
                bezerroFinanceDetails.style.display = 'flex';
                bezerroValorUnitario.setAttribute('required', 'true');
                updateBezerroValorTotal();
            } else {
                bezerroFinanceDetails.style.display = 'none';
                bezerroValorUnitario.removeAttribute('required');
                if (bezerroValorTotal) bezerroValorTotal.value = '';
            }
        });
    }

    if (bezerroValorUnitario) {
        bezerroValorUnitario.addEventListener('input', updateBezerroValorTotal);
    }
    if (bezerroQtdInput) {
        bezerroQtdInput.addEventListener('input', updateBezerroValorTotal);
    }

    formBezerro.addEventListener('submit', (e) => {
        e.preventDefault();
        const btnSalvar = e.target.querySelector('button[type="submit"]');
        if (btnSalvar) btnSalvar.disabled = true;

        const id = document.getElementById('bezerro-id').value;
        const qtd = parseInt(document.getElementById('bezerro-qtd').value) || 1;
        const sexoVal = bezerroSexo ? bezerroSexo.value : 'Macho';
        
        const bezerroBase = {
            mae: document.getElementById('bezerro-mae').value || 'Não identificada',
            data: document.getElementById('bezerro-data').value,
            sexo: sexoVal,
            peso: document.getElementById('bezerro-peso').value,
            observacoes: document.getElementById('bezerro-observacoes').value
        };

        if (id) {
            // Edição (sempre edita 1 por vez)
            DB.updateBezerro(id, bezerroBase);
            showToast('Registro de nascimento atualizado!', 'success');
        } else {
            // Criação em lote
            if (sexoVal === 'Misto') {
                const qtdFemeas = parseInt(bezerroQtdFemeas.value) || 0;
                const qtdMachos = parseInt(bezerroQtdMachos.value) || 0;
                
                if (qtdFemeas + qtdMachos !== qtd) {
                    showToast('A soma de bezerros fêmeas e machos deve ser igual à quantidade total.', 'error');
                    return;
                }

                // Cadastra fêmeas
                for (let i = 0; i < qtdFemeas; i++) {
                    DB.addBezerro({
                        ...bezerroBase,
                        sexo: 'Fêmea'
                    });
                }
                // Cadastra machos
                for (let i = 0; i < qtdMachos; i++) {
                    DB.addBezerro({
                        ...bezerroBase,
                        sexo: 'Macho'
                    });
                }
            } else {
                for (let i = 0; i < qtd; i++) {
                    DB.addBezerro({...bezerroBase}); 
                }
            }

            // Registrar receita automática se aplicável
            const registrarFinanceiro = bezerroFinanceiro ? bezerroFinanceiro.checked : false;
            if (registrarFinanceiro) {
                const valUnit = parseFloat(bezerroValorUnitario.value);
                if (valUnit <= 0 || isNaN(valUnit)) {
                    showToast('Erro: Valor unitário inválido.', 'error');
                    if (btnSalvar) btnSalvar.disabled = false;
                    return;
                }
                const valorTotal = parseFloat(bezerroValorTotal.value) || 0;
                if (valorTotal > 0) {
                    DB.addReceita({
                        tipo: 'Nascimento (Ganho de Capital)',
                        qtd: qtd,
                        peso: document.getElementById('bezerro-peso').value,
                        valor: valorTotal,
                        data: new Date().toISOString().split('T')[0],
                        observacoes: `Nascimento de bezerros lançado como Ganho de Capital. Quantidade: ${qtd}. Sexo: ${sexoVal}.`
                    });
                }
            }

            showToast(`${qtd} nascimentos registrados com sucesso!`, 'success');
        }
        
        closeModal();
        renderBezerros();
        renderReceitas(); // Atualiza painel financeiro
        updateDashboard();
    });

    function renderBezerros(filter = '') {
        const tbody = document.getElementById('table-bezerros-body');
        const emptyState = document.getElementById('empty-bezerros');
        let bezerros = DB.getBezerros().sort((a,b) => new Date(b.data) - new Date(a.data));

        if (filter) {
            // Null-safe check para mae
            bezerros = bezerros.filter(b => (b.mae || '').toLowerCase().includes(filter.toLowerCase()));
        }

        window.tablePagination = window.tablePagination || {};
        window.tablePagination.bezerros = window.tablePagination.bezerros || 50;
        const limit = window.tablePagination.bezerros;
        const paginatedBezerros = bezerros.slice(0, limit);

        tbody.innerHTML = '';
        if (bezerros.length === 0) {
            emptyState.style.display = 'block';
            tbody.parentElement.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            tbody.parentElement.style.display = 'table';
            paginatedBezerros.forEach(b => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td data-label="Selecionar"><input type="checkbox" class="bezerro-checkbox table-checkbox" value="${b.id}"></td>
                    <td data-label="Nascimento">${formatDate(b.data)}</td>
                    <td data-label="ID da Mãe"><strong>${b.mae}</strong></td>
                    <td data-label="Sexo">${b.sexo}</td>
                    <td data-label="Peso">${b.peso ? b.peso + ' kg' : '-'}</td>
                    <td data-label="Ações" class="table-actions">
                        <button class="icon-btn edit" onclick="editBezerro('${b.id}')"><i class="ph ph-pencil-simple"></i></button>
                        <button class="icon-btn delete" onclick="deleteBezerro('${b.id}')"><i class="ph ph-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            if (bezerros.length > limit) {
                const trBtn = document.createElement('tr');
                trBtn.innerHTML = `<td colspan="7" style="text-align:center; padding: 15px;"><button type="button" class="btn btn-secondary" onclick="window.tablePagination.bezerros += 50; document.getElementById('search-bezerro').dispatchEvent(new Event('input'))">Carregar Mais 50 (${bezerros.length - limit} restantes)</button></td>`;
                tbody.appendChild(trBtn);
            }
        }
        updateBulkActionBar('bezerro');
    }

    window.editBezerro = (id) => {
        const b = DB.getBezerros().find(x => x.id === id);
        if(!b) return;
        document.getElementById('bezerro-id').value = b.id;
        document.getElementById('bezerro-mae').value = b.mae;
        document.getElementById('bezerro-data').value = b.data;
        document.getElementById('bezerro-sexo').value = b.sexo;
        document.getElementById('bezerro-peso').value = b.peso;
        document.getElementById('bezerro-observacoes').value = b.observacoes;
        openModal('modal-bezerro');
    };

    window.deleteBezerro = async (id) => {
        const confirmed = await showCustomConfirm('Excluir Registro de Nascimento', 'Tem certeza que deseja excluir este registro de nascimento?', true);
        if(confirmed) {
            DB.deleteBezerro(id);
            renderBezerros();
            showToast('Registro de nascimento excluído com sucesso.', 'success');
        }
    };
    
    document.getElementById('search-bezerro').addEventListener('input', debounce((e) => {
        window.tablePagination.bezerros = 50;
        renderBezerros(e.target.value);
    }, 300));

    // === Contas (Agenda Financeira) ===
    const formConta = document.getElementById('form-conta');
    const contaTipoSelect = document.getElementById('conta-tipo');
    const contaCategoriaSelect = document.getElementById('conta-categoria');

    const despesaCategorias = ['Funcionários', 'Manutenções Gerais', 'Manutenção de Máquinas', 'Manutenção de Pastagem', 'Alimentação Animal', 'Saúde do Gado', 'Combustível', 'Outros'];
    const receitaCategorias = ['Venda de Bezerros', 'Venda de Garrotes', 'Venda de Bois (Gordo)', 'Venda de Vacas (Descarte)', 'Outros'];

    function updateContaCategorias() {
        const tipo = contaTipoSelect.value;
        const categorias = tipo === 'Pagar' ? despesaCategorias : receitaCategorias;
        
        contaCategoriaSelect.innerHTML = '<option value="">Selecione...</option>';
        categorias.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            contaCategoriaSelect.appendChild(opt);
        });
    }

    contaTipoSelect.addEventListener('change', updateContaCategorias);

    // Ajustar window.openModal para configurar o form de Contas e Gado e Bezerros
    const originalOpenModal = window.openModal;
    window.openModal = function(modalId) {
        // Fechar FAB mobile se estiver ativo ao abrir qualquer modal
        const mobileFabContainer = document.getElementById('mobile-fab-container');
        if (mobileFabContainer) {
            mobileFabContainer.classList.remove('active');
        }

        if (modalId === 'modal-conta') {
            document.getElementById('modal-conta-title').textContent = 'Nova Conta';
            document.getElementById('conta-id').value = '';
            updateContaCategorias();
        } else if (modalId === 'modal-gado') {
            // Garantir que abre na aba individual e limpa campos mistos/financeiros ocultos
            if (typeof switchGadoCadastroMode === 'function') {
                switchGadoCadastroMode('individual');
            }
            const mistoDist = document.getElementById('gado-lote-misto-dist');
            const financeDetails = document.getElementById('gado-lote-finance-details');
            if (mistoDist) mistoDist.style.display = 'none';
            if (financeDetails) financeDetails.style.display = 'none';
            
            // Oculta abas se for edição de gado (evita cadastro em lote ao editar)
            const gadoId = document.getElementById('gado-id').value;
            const tabsDiv = document.querySelector('#modal-gado .modal-tabs');
            if (gadoId) {
                if (tabsDiv) tabsDiv.style.display = 'none';
            } else {
                if (tabsDiv) tabsDiv.style.display = 'flex';
            }
        } else if (modalId === 'modal-bezerro') {
            // Popula o datalist de fêmeas ativas
            const datalist = document.getElementById('lista-femeas');
            if (datalist) {
                const femeas = DB.getGado().filter(g => g.sexo === 'Fêmea' && (g.situacao === 'Ativo no Pasto' || g.situacao === 'Em Tratamento'));
                datalist.innerHTML = femeas.map(f => `<option value="${f.brinco}">${f.lote ? 'Lote: ' + f.lote : 'Sem Lote'}</option>`).join('');
            }

            // Garantir que limpa campos mistos ocultos
            const mistoDist = document.getElementById('bezerro-misto-dist');
            if (mistoDist) mistoDist.style.display = 'none';
            const f = document.getElementById('bezerro-qtd-femeas');
            const m = document.getElementById('bezerro-qtd-machos');
            if (f) f.removeAttribute('required');
            if (m) m.removeAttribute('required');
        }
        originalOpenModal(modalId);
    };

    formConta.addEventListener('submit', (e) => {
        e.preventDefault();
        const valorInput = parseFloat(document.getElementById('conta-valor').value);
        if (valorInput <= 0) {
            showToast('Erro: O valor deve ser maior que zero.', 'error');
            return;
        }

        const btnSalvar = e.target.querySelector('button[type="submit"]');
        if (btnSalvar) btnSalvar.disabled = true;

        const id = document.getElementById('conta-id').value;
        const conta = {
            tipo: document.getElementById('conta-tipo').value,
            categoria: document.getElementById('conta-categoria').value,
            descricao: document.getElementById('conta-descricao').value,
            valor: document.getElementById('conta-valor').value,
            vencimento: document.getElementById('conta-vencimento').value,
            recorrencia: document.getElementById('conta-recorrencia').value,
            observacoes: document.getElementById('conta-observacoes').value,
            status: id ? (DB.getContas().find(x => x.id === id)?.status || 'Pendente') : 'Pendente'
        };

        if (id) {
            DB.updateConta(id, conta);
            showToast('Conta atualizada com sucesso!', 'success');
        } else {
            DB.addConta(conta);
            showToast('Conta agendada com sucesso!', 'success');
        }
        
        closeModal();
        renderContas();
        updateDashboard();
    });

    let currentContaFilter = 'todas';
    let currentContaSearch = '';

    function renderContas() {
        const tbody = document.getElementById('table-contas-body');
        const emptyState = document.getElementById('empty-contas');
        const filtro = document.getElementById('filtro-contas').value;
        
        let contas = DB.getContas().sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento));

        // Calcular somatórios e alertas
        updateContasSummary(contas);

        if (filtro !== 'Todas') {
            contas = contas.filter(c => c.tipo === filtro);
        }

        // Filtro de Busca
        if (currentContaSearch) {
            contas = contas.filter(c => 
                c.descricao.toLowerCase().includes(currentContaSearch.toLowerCase()) ||
                c.categoria.toLowerCase().includes(currentContaSearch.toLowerCase())
            );
        }

        // Filtro por Abas
        if (currentContaFilter === 'pagar') {
            contas = contas.filter(c => c.tipo === 'Pagar');
        } else if (currentContaFilter === 'receber') {
            contas = contas.filter(c => c.tipo === 'Receber');
        } else if (currentContaFilter === 'pendentes') {
            contas = contas.filter(c => c.status === 'Pendente');
        } else if (currentContaFilter === 'pagas') {
            contas = contas.filter(c => c.status === 'Pago');
        }

        window.tablePagination = window.tablePagination || {};
        window.tablePagination.contas = window.tablePagination.contas || 50;
        const limit = window.tablePagination.contas;
        const paginatedContas = contas.slice(0, limit);

        tbody.innerHTML = '';
        if (contas.length === 0) {
            emptyState.style.display = 'block';
            tbody.parentElement.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            tbody.parentElement.style.display = 'table';
            
            const hojeStr = new Date().toISOString().split('T')[0];

            paginatedContas.forEach(c => {
                const tr = document.createElement('tr');
                
                let statusClass = 'pendente';
                let statusText = 'Pendente';
                if (c.status === 'Pago') {
                    statusClass = 'pago';
                    statusText = 'Pago';
                } else if (c.vencimento < hojeStr) {
                    statusClass = 'atrasado';
                    statusText = 'Atrasada';
                }

                const statusBadge = `<span class="badge-status ${statusClass}">${statusText}</span>`;
                const tipoBadge = `<span class="badge-tipo ${c.tipo.toLowerCase()}">${c.tipo === 'Pagar' ? 'Despesa' : 'Receita'}</span>`;
                
                let actionButtons = '';
                if (c.status === 'Pendente') {
                    actionButtons = `
                        <button class="action-btn pay" title="Dar Baixa" onclick="quitarConta('${c.id}')"><i class="ph ph-check-circle"></i></button>
                        <button class="icon-btn edit" title="Editar" onclick="editConta('${c.id}')"><i class="ph ph-pencil-simple"></i></button>
                    `;
                }
                actionButtons += `<button class="action-btn delete" title="Excluir" onclick="deleteConta('${c.id}')"><i class="ph ph-trash"></i></button>`;

                tr.innerHTML = `
                    <td data-label="Status">${statusBadge}</td>
                    <td data-label="Vencimento">${formatDate(c.vencimento)}</td>
                    <td data-label="Tipo">${tipoBadge}</td>
                    <td data-label="Descrição"><strong>${c.descricao}</strong></td>
                    <td data-label="Categoria">${c.categoria}</td>
                    <td data-label="Valor" style="color: ${c.tipo === 'Pagar' ? 'var(--danger)' : 'var(--success)'}; font-weight: 500;">
                        ${formatCurrency(c.valor)}
                    </td>
                    <td data-label="Recorrência"><span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">${c.recorrencia || 'Nenhuma'}</span></td>
                    <td data-label="Ações">
                        <div class="action-buttons">
                            ${actionButtons}
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    function updateContasSummary(allContas) {
        const hojeStr = new Date().toISOString().split('T')[0];
        
        let totalAtrasadas = 0;
        let totalVenceHoje = 0;
        let totalAVencer = 0;
        let overdueCount = 0;

        const trintaDiasFrente = new Date();
        trintaDiasFrente.setDate(trintaDiasFrente.getDate() + 30);
        const trintaDiasStr = trintaDiasFrente.toISOString().split('T')[0];

        allContas.forEach(c => {
            if (c.status === 'Pendente') {
                const val = c.valor;
                if (c.vencimento < hojeStr) {
                    totalAtrasadas += val;
                    overdueCount++;
                } else if (c.vencimento === hojeStr) {
                    totalVenceHoje += val;
                } else if (c.vencimento > hojeStr && c.vencimento <= trintaDiasStr) {
                    totalAVencer += val;
                }
            }
        });

        document.getElementById('contas-atrasadas').textContent = formatCurrency(totalAtrasadas);
        document.getElementById('contas-vence-hoje').textContent = formatCurrency(totalVenceHoje);
        document.getElementById('contas-a-vencer').textContent = formatCurrency(totalAVencer);

        const badge = document.getElementById('overdue-badge-count');
        if (overdueCount > 0) {
            badge.textContent = overdueCount;
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
    }

    window.editConta = (id) => {
        const c = DB.getContas().find(x => x.id === id);
        if(!c) return;
        
        // Usa originalOpenModal para NÃO limpar o conta-id e título
        // (o openModal sobrescrito reseta esses valores para 'Nova Conta')
        originalOpenModal('modal-conta');
        
        // Preenche após abrir o modal para evitar o reset do openModal
        document.getElementById('modal-conta-title').textContent = 'Editar Conta';
        document.getElementById('conta-id').value = c.id;
        document.getElementById('conta-tipo').value = c.tipo;
        
        updateContaCategorias();
        document.getElementById('conta-categoria').value = c.categoria;
        
        document.getElementById('conta-descricao').value = c.descricao;
        document.getElementById('conta-valor').value = c.valor;
        document.getElementById('conta-vencimento').value = c.vencimento;
        document.getElementById('conta-recorrencia').value = c.recorrencia || 'Nenhuma';
        document.getElementById('conta-observacoes').value = c.observacoes || '';
    };

    window.deleteConta = async (id) => {
        const confirmed = await showCustomConfirm('Excluir Conta Agendada', 'Tem certeza que deseja excluir esta conta agendada?', true);
        if (confirmed) {
            DB.deleteConta(id);
            renderContas();
            showToast('Conta excluída com sucesso.', 'success');
        }
    };

    window.quitarConta = async (id) => {
        const confirmed = await showCustomConfirm(
            'Confirmar Pagamento / Recebimento',
            'Deseja marcar esta conta como PAGA/RECEBIDA? Isso registrará automaticamente o lançamento correspondente nas suas Despesas ou Receitas históricas.',
            false
        );
        if (confirmed) {
            const c = DB.quitarConta(id);
            renderContas();
            
            // Recarregar os outros módulos e dashboard para atualizar gráficos e históricos
            renderDespesas();
            renderReceitas();
            updateDashboard();

            showToast(`Conta "${c.descricao}" quitada com sucesso!`, 'success');
        }
    };

    // Eventos de Filtro e Busca
    document.querySelectorAll('.filter-group .btn-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-group .btn-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentContaFilter = btn.getAttribute('data-filter');
            renderContas();
        });
    });

    document.getElementById('search-conta').addEventListener('input', debounce((e) => {
        currentContaSearch = e.target.value;
        renderContas();
    }, 300));

    // --- Dashboard & Charts ---
    let financeChartInstance = null;
    let expenseChartInstance = null;

    let isUpdatingDashboard = false;
    function updateDashboard() {
        if (isUpdatingDashboard) return;
        isUpdatingDashboard = true;
        requestAnimationFrame(() => {
            _updateDashboardReal();
            isUpdatingDashboard = false;
        });
    }

    function _updateDashboardReal() {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        const despesas = DB.getDespesas();
        const receitas = DB.getReceitas();
        const gado = DB.getGado();

        // Calculate this month's totals
        let totalDespesasMes = 0;
        let totalReceitasMes = 0;

        despesas.forEach(d => {
            if (!d.data) return;
            const [year, month] = d.data.split('-');
            if (parseInt(month, 10) - 1 === currentMonth && parseInt(year, 10) === currentYear) {
                totalDespesasMes += d.valor;
            }
        });

        receitas.forEach(r => {
            if (!r.data) return;
            const [year, month] = r.data.split('-');
            if (parseInt(month, 10) - 1 === currentMonth && parseInt(year, 10) === currentYear) {
                totalReceitasMes += r.valor;
            }
        });

        const lucroLiquido = totalReceitasMes - totalDespesasMes;

        document.getElementById('dash-despesas').textContent = formatCurrency(totalDespesasMes);
        document.getElementById('dash-receitas').textContent = formatCurrency(totalReceitasMes);
        
        const lucroEl = document.getElementById('dash-lucro');
        lucroEl.textContent = formatCurrency(lucroLiquido);
        lucroEl.style.color = lucroLiquido >= 0 ? 'var(--success)' : 'var(--danger)';

        document.getElementById('dash-gado').textContent = gado.filter(g => g.situacao !== 'Morto' && g.situacao !== 'Vendido').length;

        updateCharts(totalReceitasMes, totalDespesasMes, despesas, receitas, currentMonth, currentYear);
    }

    function updateCharts(receitasMes, despesasMes, allDespesas, allReceitas, currentMonth, currentYear) {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js SDK não carregado. Pulando renderização de gráficos.');
            return;
        }
        // === Gráfico Receitas vs Despesas — Últimos 6 meses (mobile-first) ===
        const mesesNomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

        // Monta os rótulos e dados dos últimos 6 meses
        const labels6 = [];
        const dadosReceitas6 = [];
        const dadosDespesas6 = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(currentYear, currentMonth - i, 1);
            const m = d.getMonth();
            const y = d.getFullYear();
            labels6.push(mesesNomes[m]);

            let totalR = 0;
            allReceitas.forEach(r => {
                if (!r.data) return;
                const [ry, rm] = r.data.split('-');
                if (parseInt(rm, 10) - 1 === m && parseInt(ry, 10) === y) totalR += r.valor;
            });

            let totalD = 0;
            allDespesas.forEach(d2 => {
                if (!d2.data) return;
                const [dy, dm] = d2.data.split('-');
                if (parseInt(dm, 10) - 1 === m && parseInt(dy, 10) === y) totalD += d2.valor;
            });

            dadosReceitas6.push(totalR);
            dadosDespesas6.push(totalD);
        }

        // Função auxiliar para formatar valores compactos no eixo Y
        function formatCompact(value) {
            if (value >= 1000000) return 'R$' + (value / 1000000).toFixed(1).replace('.', ',') + 'M';
            if (value >= 1000) return 'R$' + (value / 1000).toFixed(0) + 'k';
            return 'R$' + value.toFixed(0);
        }

        const ctxFinance = document.getElementById('financeChart').getContext('2d');
        if (financeChartInstance) financeChartInstance.destroy();

        const isMobile = window.innerWidth <= 768;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        // Cores Dinâmicas de acordo com o Tema
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
        const textLabelColor = isDark ? '#94A3B8' : '#6C757D';
        const tooltipBg = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        const tooltipBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : '#E9ECEF';
        const tooltipTitle = isDark ? '#F8FAFC' : '#212529';
        const tooltipBody = isDark ? '#CBD5E1' : '#495057';
        const doughnutBorderColor = isDark ? '#0d1f17' : '#FFFFFF';

        // Criar gradientes elegantes para as curvas do financeChart
        const gradReceitas = ctxFinance.createLinearGradient(0, 0, 0, 300);
        gradReceitas.addColorStop(0, 'rgba(40, 167, 69, 0.35)');
        gradReceitas.addColorStop(1, 'rgba(40, 167, 69, 0.00)');

        const gradDespesas = ctxFinance.createLinearGradient(0, 0, 0, 300);
        gradDespesas.addColorStop(0, 'rgba(220, 53, 69, 0.35)');
        gradDespesas.addColorStop(1, 'rgba(220, 53, 69, 0.00)');

        financeChartInstance = new Chart(ctxFinance, {
            type: 'line',
            data: {
                labels: labels6,
                datasets: [
                    {
                        label: 'Receitas',
                        data: dadosReceitas6,
                        borderColor: '#28A745',
                        backgroundColor: gradReceitas,
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointBackgroundColor: '#28A745',
                        pointHoverRadius: 6,
                        pointHoverBackgroundColor: '#28A745',
                        pointHoverBorderColor: '#ffffff',
                        pointHoverBorderWidth: 2
                    },
                    {
                        label: 'Despesas',
                        data: dadosDespesas6,
                        borderColor: '#DC3545',
                        backgroundColor: gradDespesas,
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointBackgroundColor: '#DC3545',
                        pointHoverRadius: 6,
                        pointHoverBackgroundColor: '#DC3545',
                        pointHoverBorderColor: '#ffffff',
                        pointHoverBorderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        left: 0,
                        right: 0,
                        top: 4,
                        bottom: 0
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        align: 'center',
                        labels: {
                            padding: 16,
                            boxWidth: 12,
                            boxHeight: 12,
                            borderRadius: 3,
                            useBorderRadius: true,
                            font: { size: isMobile ? 11 : 12, family: 'Outfit' },
                            color: textLabelColor
                        }
                    },
                    tooltip: {
                        backgroundColor: tooltipBg,
                        titleColor: tooltipTitle,
                        bodyColor: tooltipBody,
                        borderColor: tooltipBorder,
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 8,
                        titleFont: { weight: '600', family: 'Outfit' },
                        bodyFont: { family: 'Outfit' },
                        callbacks: {
                            label: function(context) {
                                const val = context.raw || 0;
                                return ' ' + context.dataset.label + ': ' + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: {
                            font: { size: isMobile ? 10 : 12, family: 'Outfit' },
                            color: textLabelColor
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: gridColor,
                            drawBorder: false
                        },
                        border: { display: false, dash: [4, 4] },
                        ticks: {
                            maxTicksLimit: 5,
                            font: { size: isMobile ? 9 : 11, family: 'Outfit' },
                            color: textLabelColor,
                            callback: function(value) {
                                return formatCompact(value);
                            }
                        }
                    }
                }
            }
        });

        // === Gráfico Doughnut — Despesas por Categoria (mobile-first) ===
        const categorias = {};
        allDespesas.forEach(d => {
            if (!d.data) return;
            const [year, month] = d.data.split('-');
            if (parseInt(month, 10) - 1 === currentMonth && parseInt(year, 10) === currentYear) {
                categorias[d.categoria] = (categorias[d.categoria] || 0) + d.valor;
            }
        });

        const ctxExpense = document.getElementById('expenseChart').getContext('2d');
        if (expenseChartInstance) expenseChartInstance.destroy();

        const pieLabels = Object.keys(categorias);
        const pieData = Object.values(categorias);
        const totalDespesas = pieData.reduce((a, b) => a + b, 0);

        // Curated HSL colors for dark mode & light mode
        const doughnutColors = isDark ? [
            '#2D6A4F', '#40916C', '#52B788', '#74C69D',
            '#95D5B2', '#1B4332', '#0D1F17', '#1E3A2F'
        ] : [
            '#1B4332', '#2D6A4F', '#40916C', '#52B788',
            '#74C69D', '#95D5B2', '#B7E4C7', '#D8F3DC'
        ];

        expenseChartInstance = new Chart(ctxExpense, {
            type: 'doughnut',
            data: {
                labels: pieLabels.length ? pieLabels : ['Sem dados'],
                datasets: [{
                    data: pieData.length ? pieData : [1],
                    backgroundColor: pieData.length ? doughnutColors : (isDark ? ['#1e293b'] : ['#E9ECEF']),
                    borderWidth: 2,
                    borderColor: doughnutBorderColor,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: 0
                },
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        align: 'center',
                        labels: {
                            padding: 10,
                            boxWidth: 10,
                            boxHeight: 10,
                            borderRadius: 3,
                            useBorderRadius: true,
                            font: { size: isMobile ? 10 : 11, family: 'Outfit' },
                            color: textLabelColor,
                            generateLabels: function(chart) {
                                const data = chart.data;
                                if (!pieData.length) return [{ text: 'Sem dados', fillStyle: isDark ? '#1e293b' : '#E9ECEF' }];
                                return data.labels.map((label, i) => {
                                    const val = pieData[i] || 0;
                                    const pct = totalDespesas > 0 ? ((val / totalDespesas) * 100).toFixed(0) : 0;
                                    const shortLabel = label.length > 14 ? label.substring(0, 13) + '…' : label;
                                    return {
                                        text: shortLabel + ' (' + pct + '%)',
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        strokeStyle: doughnutBorderColor,
                                        lineWidth: 1,
                                        index: i
                                    };
                                });
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: tooltipBg,
                        titleColor: tooltipTitle,
                        bodyColor: tooltipBody,
                        borderColor: tooltipBorder,
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const val = context.raw || 0;
                                const pct = totalDespesas > 0 ? ((val / totalDespesas) * 100).toFixed(1) : 0;
                                return ' ' + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val) + ' (' + pct + '%)';
                            }
                        }
                    }
                }
            }
        });
    }

    // Reports Generation Mock
    window.generateReport = function(type) {
        const resultsDiv = document.getElementById('report-results');
        resultsDiv.style.display = 'block';
        if (type === 'finance') {
            const despesas = DB.getDespesas();
            const receitas = DB.getReceitas();
            const totalD = despesas.reduce((acc, curr) => acc + curr.valor, 0);
            const totalR = receitas.reduce((acc, curr) => acc + curr.valor, 0);
            resultsDiv.innerHTML = `
                <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <h3 style="color: var(--primary); margin-bottom: 1rem;">Relatório Financeiro Geral</h3>
                    <p><strong>Total Histórico de Receitas:</strong> ${formatCurrency(totalR)}</p>
                    <p><strong>Total Histórico de Despesas:</strong> <span style="color: red;">${formatCurrency(totalD)}</span></p>
                    <hr style="margin: 1rem 0; border: none; border-top: 1px solid #eee;">
                    <p><strong>Balanço Geral:</strong> <strong style="color: ${totalR - totalD >= 0 ? 'green' : 'red'};">${formatCurrency(totalR - totalD)}</strong></p>
                </div>
            `;
        } else if (type === 'cattle') {
            const gado = DB.getGado();
            const bezerros = DB.getBezerros();
            const ativos = gado.filter(g => g.situacao === 'Ativo no Pasto').length;
            const vendidos = gado.filter(g => g.situacao === 'Vendido').length;
            const mortos = gado.filter(g => g.situacao === 'Morto').length;
            
            // Lógica de filtragem de datas para bezerros
            const hoje = new Date();
            
            // 1. Mês atual
            const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            
            // 2. Últimos 6 meses
            const inicio6Meses = new Date();
            inicio6Meses.setMonth(hoje.getMonth() - 6);
            
            // 3. Último ano (12 meses)
            const inicioAno = new Date();
            inicioAno.setFullYear(hoje.getFullYear() - 1);
            
            const filterBirths = (startDate) => {
                const filtered = bezerros.filter(b => {
                    if (!b.data) return false;
                    // Tratando fuso horário
                    const birthDate = new Date(b.data + 'T00:00:00');
                    return birthDate >= startDate && birthDate <= hoje;
                });
                const total = filtered.length;
                const femeas = filtered.filter(b => b.sexo === 'Fêmea').length;
                const machos = filtered.filter(b => b.sexo === 'Macho').length;
                return { total, femeas, machos };
            };
            
            const mesAtualStats = filterBirths(inicioMesAtual);
            const ultimos6MesesStats = filterBirths(inicio6Meses);
            const ultimoAnoStats = filterBirths(inicioAno);
            
            resultsDiv.innerHTML = `
                <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); animation: slideDownSection 0.4s ease;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; border-bottom: 2px solid var(--border-color); padding-bottom: 0.75rem;">
                        <h3 style="color: var(--primary); margin: 0; display: flex; align-items: center; gap: 8px;">
                            <i class="ph ph-cow" style="font-size: 1.5rem;"></i> Relatório de Evolução do Rebanho
                        </h3>
                        <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">
                            Gerado em ${new Date().toLocaleDateString('pt-BR')}
                        </span>
                    </div>
                    
                    <!-- Resumo Geral -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; border-left: 4px solid var(--primary); text-align: center;">
                            <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">Ativos no Pasto</p>
                            <h4 style="margin: 0.25rem 0 0; font-size: 1.5rem; color: var(--primary); font-weight: 700;">${ativos}</h4>
                        </div>
                        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; border-left: 4px solid var(--success); text-align: center;">
                            <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">Vendidos</p>
                            <h4 style="margin: 0.25rem 0 0; font-size: 1.5rem; color: var(--success); font-weight: 700;">${vendidos}</h4>
                        </div>
                        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; border-left: 4px solid var(--danger); text-align: center;">
                            <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">Mortalidade</p>
                            <h4 style="margin: 0.25rem 0 0; font-size: 1.5rem; color: var(--danger); font-weight: 700;">${mortos}</h4>
                        </div>
                        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; border-left: 4px solid #007bff; text-align: center;">
                            <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">Nascidos (Histórico)</p>
                            <h4 style="margin: 0.25rem 0 0; font-size: 1.5rem; color: #007bff; font-weight: 700;">${bezerros.length}</h4>
                        </div>
                    </div>

                    <!-- Relatório de Nascimentos detalhados por período -->
                    <h4 style="color: var(--text-main); margin: 0 0 1rem 0; font-size: 1.1rem; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                        <i class="ph ph-baby" style="color: var(--primary);"></i> Controle de Nascimentos (Bezerros)
                    </h4>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.25rem;">
                        <!-- Mês Atual -->
                        <div style="border: 1px solid var(--border-color); padding: 1.25rem; border-radius: 8px; background: rgba(64, 145, 108, 0.02);">
                            <h5 style="margin: 0 0 0.75rem 0; font-size: 0.95rem; color: var(--primary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Neste Mês</h5>
                            <div style="font-size: 1.8rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem;">
                                ${mesAtualStats.total} <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 400;">nascidos</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; border-top: 1px solid #f1f5f9; padding-top: 0.5rem; font-size: 0.9rem;">
                                <span style="color: #e63946; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><i class="ph ph-gender-female"></i> Fêmeas: ${mesAtualStats.femeas}</span>
                                <span style="color: #457b9d; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><i class="ph ph-gender-male"></i> Machos: ${mesAtualStats.machos}</span>
                            </div>
                        </div>

                        <!-- Últimos 6 Meses -->
                        <div style="border: 1px solid var(--border-color); padding: 1.25rem; border-radius: 8px; background: rgba(64, 145, 108, 0.02);">
                            <h5 style="margin: 0 0 0.75rem 0; font-size: 0.95rem; color: var(--primary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Últimos 6 Meses</h5>
                            <div style="font-size: 1.8rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem;">
                                ${ultimos6MesesStats.total} <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 400;">nascidos</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; border-top: 1px solid #f1f5f9; padding-top: 0.5rem; font-size: 0.9rem;">
                                <span style="color: #e63946; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><i class="ph ph-gender-female"></i> Fêmeas: ${ultimos6MesesStats.femeas}</span>
                                <span style="color: #457b9d; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><i class="ph ph-gender-male"></i> Machos: ${ultimos6MesesStats.machos}</span>
                            </div>
                        </div>

                        <!-- Último Ano -->
                        <div style="border: 1px solid var(--border-color); padding: 1.25rem; border-radius: 8px; background: rgba(64, 145, 108, 0.02);">
                            <h5 style="margin: 0 0 0.75rem 0; font-size: 0.95rem; color: var(--primary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Último Ano (12 meses)</h5>
                            <div style="font-size: 1.8rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem;">
                                ${ultimoAnoStats.total} <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 400;">nascidos</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; border-top: 1px solid #f1f5f9; padding-top: 0.5rem; font-size: 0.9rem;">
                                <span style="color: #e63946; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><i class="ph ph-gender-female"></i> Fêmeas: ${ultimoAnoStats.femeas}</span>
                                <span style="color: #457b9d; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><i class="ph ph-gender-male"></i> Machos: ${ultimoAnoStats.machos}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    };

    // --- Lógica de Ações em Lote (Bulk Actions) ---
    let selectedGado = [];
    let selectedBezerros = [];

    const bulkActionBar = document.getElementById('bulk-action-bar');
    const bulkCountSpan = document.getElementById('bulk-count');
    const bulkActionsContainer = document.getElementById('bulk-actions-container');
    
    document.getElementById('close-bulk-bar').addEventListener('click', () => {
        selectedGado = [];
        selectedBezerros = [];
        updateBulkActionBar('gado');
        updateBulkActionBar('bezerro');
        
        document.querySelectorAll('.table-checkbox').forEach(cb => cb.checked = false);
    });

    // Delegando eventos para as checkboxes na tabela
    document.addEventListener('change', (e) => {
        if (e.target.id === 'select-all-gado') {
            const checkboxes = document.querySelectorAll('.gado-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            selectedGado = e.target.checked ? Array.from(checkboxes).map(cb => cb.value) : [];
            updateBulkActionBar('gado');
        } else if (e.target.id === 'select-all-bezerros') {
            const checkboxes = document.querySelectorAll('.bezerro-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            selectedBezerros = e.target.checked ? Array.from(checkboxes).map(cb => cb.value) : [];
            updateBulkActionBar('bezerro');
        } else if (e.target.classList.contains('gado-checkbox')) {
            if (e.target.checked) selectedGado.push(e.target.value);
            else selectedGado = selectedGado.filter(id => id !== e.target.value);
            
            document.getElementById('select-all-gado').checked = selectedGado.length === document.querySelectorAll('.gado-checkbox').length;
            updateBulkActionBar('gado');
        } else if (e.target.classList.contains('bezerro-checkbox')) {
            if (e.target.checked) selectedBezerros.push(e.target.value);
            else selectedBezerros = selectedBezerros.filter(id => id !== e.target.value);
            
            document.getElementById('select-all-bezerros').checked = selectedBezerros.length === document.querySelectorAll('.bezerro-checkbox').length;
            updateBulkActionBar('bezerro');
        }
    });

    window.updateBulkActionBar = (type) => {
        const count = type === 'gado' ? selectedGado.length : selectedBezerros.length;
        
        if (count > 0) {
            bulkCountSpan.textContent = count;
            bulkActionBar.classList.add('active');
            
            if (type === 'gado') {
                bulkActionsContainer.innerHTML = `
                    <button class="btn btn-outline" style="color: var(--danger); border-color: var(--danger);" onclick="bulkDeleteGado()">Excluir Selecionados</button>
                `;
            } else if (type === 'bezerro') {
                bulkActionsContainer.innerHTML = `
                    <button class="btn btn-primary" onclick="openDesmameModal()">Desmamar Selecionados</button>
                    <button class="btn btn-outline" style="color: var(--danger); border-color: var(--danger);" onclick="bulkDeleteBezerros()">Excluir Selecionados</button>
                `;
            }
        } else {
            bulkActionBar.classList.remove('active');
        }
    };

    window.bulkDeleteGado = async () => {
        if (selectedGado.length === 0) return;
        const confirmed = await showCustomConfirm('Excluir Gado em Lote', `Tem certeza que deseja excluir ${selectedGado.length} animais? Isso não pode ser desfeito.`, true);
        if (confirmed) {
            showLoader(true, 'Excluindo...');
            for (const id of selectedGado) {
                await DB.deleteGado(id);
            }
            showLoader(false);
            showToast(`${selectedGado.length} animais excluídos.`, 'success');
            document.getElementById('close-bulk-bar').click();
            renderGado();
            updateDashboard();
        }
    };

    window.bulkDeleteBezerros = async () => {
        if (selectedBezerros.length === 0) return;
        const confirmed = await showCustomConfirm('Excluir Bezerros em Lote', `Tem certeza que deseja excluir ${selectedBezerros.length} nascimentos?`, true);
        if (confirmed) {
            showLoader(true, 'Excluindo...');
            for (const id of selectedBezerros) {
                await DB.deleteBezerro(id);
            }
            showLoader(false);
            showToast(`${selectedBezerros.length} nascimentos excluídos.`, 'success');
            document.getElementById('close-bulk-bar').click();
            renderBezerros();
        }
    };

    // --- Modal Desmame (Weaning) ---
    window.openDesmameModal = () => {
        document.getElementById('desmame-count').textContent = selectedBezerros.length;
        document.getElementById('form-desmame').reset();
        openModal('modal-desmame');
    };

    document.getElementById('form-desmame').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-confirmar-desmame');
        btn.disabled = true;
        btn.textContent = 'Processando...';

        const lote = document.getElementById('desmame-lote').value.trim();
        const peso = document.getElementById('desmame-peso').value;

        const bezerrosDB = DB.getBezerros();
        let convertidos = 0;

        for (const id of selectedBezerros) {
            const b = bezerrosDB.find(x => x.id === id);
            if (b) {
                // Adiciona como Gado Adulto
                await DB.addGado({
                    brinco: '', // Conforme pedido do usuário (em branco para evitar confusão)
                    sexo: b.sexo,
                    nascimento: b.data, // Data de nascimento original
                    lote: lote,
                    peso: peso,
                    situacao: 'Ativo no Pasto'
                });
                // Remove dos Bezerros
                await DB.deleteBezerro(id);
                convertidos++;
            }
        }

        closeModal();
        btn.disabled = false;
        btn.textContent = 'Confirmar Desmame';
        
        document.getElementById('close-bulk-bar').click();
        
        showToast(`${convertidos} bezerros transferidos para o rebanho adulto!`, 'success');
        
        renderBezerros();
        renderGado();
        updateDashboard();
    });

    // --- Exportações Profissionais (PDF/Excel) ---
    window.exportFinanceExcel = () => {
        try {
            const despesas = DB.getDespesas();
            const receitas = DB.getReceitas();
            
            let dados = [];
            despesas.forEach(d => {
                dados.push({ Data: d.data, Tipo: 'Despesa', Categoria: d.categoria, Descricao: d.descricao, Valor: d.valor * -1 });
            });
            receitas.forEach(r => {
                dados.push({ Data: r.data, Tipo: 'Receita', Categoria: r.tipo, Descricao: r.observacoes || 'Venda', Valor: r.valor });
            });
            
            dados.sort((a,b) => new Date(a.Data) - new Date(b.Data));
            
            if(dados.length === 0) {
                showToast('Nenhum dado financeiro para exportar.', 'error');
                return;
            }

            // Usando SheetJS (XLSX)
            const worksheet = XLSX.utils.json_to_sheet(dados);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Fluxo de Caixa");
            
            XLSX.writeFile(workbook, "Relatorio_Financeiro_AgroControl.xlsx");
            showToast('Download do Excel iniciado!', 'success');
        } catch(err) {
            console.error('Erro na exportação Excel:', err);
            showToast('Erro ao exportar. O script do SheetJS pode estar ausente.', 'error');
        }
    };

    window.exportCattlePDF = () => {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const gado = DB.getGado();
            const ativos = gado.filter(g => g.situacao === 'Ativo no Pasto' || g.situacao === 'Em Tratamento');
            
            doc.setFontSize(18);
            doc.text("AgroControl Rural - Relatório de Rebanho", 14, 20);
            
            doc.setFontSize(11);
            doc.text(`Data da Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);
            doc.text(`Total de Cabeças Ativas: ${ativos.length}`, 14, 34);
            
            const tableColumn = ["Brinco", "Sexo", "Nascimento", "Peso", "Lote", "Status"];
            const tableRows = [];
            
            ativos.forEach(g => {
                tableRows.push([
                    g.brinco || '-',
                    g.sexo,
                    g.nascimento ? formatDate(g.nascimento) : '-',
                    g.peso ? g.peso + ' kg' : '-',
                    g.lote || '-',
                    g.situacao
                ]);
            });
            
            if(tableRows.length === 0) {
                showToast('Nenhum animal ativo para exportar.', 'error');
                return;
            }

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 40,
                theme: 'striped',
                headStyles: { fillColor: [27, 67, 50] } // Cor primary do AgroControl
            });
            
            doc.save("Relatorio_Rebanho_AgroControl.pdf");
            showToast('Download do PDF iniciado!', 'success');
        } catch(err) {
            console.error('Erro na exportação PDF:', err);
            showToast('Erro ao exportar PDF. O script do jsPDF pode estar ausente.', 'error');
        }
    };

    // --- Mapa de Pastos (Leaflet) ---
    let farmMap = null;
    
    window.initMap = function() {
        if (!document.getElementById('farm-map')) return;
        
        if (farmMap) {
            setTimeout(() => {
                farmMap.invalidateSize();
            }, 300);
            return;
        }

        const lat = -23.5505;
        const lng = -46.6333;

        farmMap = L.map('farm-map').setView([lat, lng], 14);

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri'
        }).addTo(farmMap);

        const piquetes = [
            {
                "type": "Feature",
                "properties": {
                    "name": "Piquete 1",
                    "status": "Em Descanso",
                    "color": "#28a745"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [lng - 0.01, lat + 0.01],
                        [lng + 0.005, lat + 0.01],
                        [lng + 0.005, lat - 0.005],
                        [lng - 0.01, lat - 0.005],
                        [lng - 0.01, lat + 0.01]
                    ]]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "name": "Piquete 2",
                    "status": "Ocupado (Lote A)",
                    "color": "#dc3545"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [lng + 0.006, lat + 0.01],
                        [lng + 0.02, lat + 0.01],
                        [lng + 0.02, lat - 0.005],
                        [lng + 0.006, lat - 0.005],
                        [lng + 0.006, lat + 0.01]
                    ]]
                }
            }
        ];

        L.geoJSON(piquetes, {
            style: function (feature) {
                return {
                    color: feature.properties.color,
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.4
                };
            },
            onEachFeature: function (feature, layer) {
                layer.bindPopup(`
                    <div style="font-family: inherit; color: #333;">
                        <h4 style="margin:0 0 5px 0;">${feature.properties.name}</h4>
                        <p style="margin:0;">Status: <strong>${feature.properties.status}</strong></p>
                    </div>
                `);
                
                layer.on('mouseover', function () {
                    this.setStyle({ fillOpacity: 0.7 });
                });
                layer.on('mouseout', function () {
                    this.setStyle({ fillOpacity: 0.4 });
                });
            }
        }).addTo(farmMap);

        setTimeout(() => {
            farmMap.invalidateSize();
        }, 300);
    };

    // Initialize Theme after all variables and listeners are configured
    initTheme();
});

// --- Funções Globais Independentes ---
window.openInventarioView = function() {
    try {
        console.log("Abrindo inventário global...");
        const todosAnimais = window.DB ? window.DB.getGado() : [];
        const ativos = todosAnimais.filter(a => a.situacao !== 'Morto' && a.situacao !== 'Vendido');
        
        let m0_6 = 0, f0_6 = 0;
        let m7_12 = 0, f7_12 = 0;
        let m13_24 = 0, f13_24 = 0;
        let m25_36 = 0, f25_36 = 0;
        let m36_mais = 0, f36_mais = 0;

        const hoje = new Date();

        ativos.forEach(a => {
            if (!a.nascimento) return;
            let nasc;
            if (a.nascimento.includes('/')) {
                const parts = a.nascimento.split('/');
                nasc = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`);
            } else {
                nasc = new Date(a.nascimento + 'T12:00:00');
            }

            if (isNaN(nasc.getTime())) return;

            let meses = (hoje.getFullYear() - nasc.getFullYear()) * 12 + (hoje.getMonth() - nasc.getMonth());
            if (hoje.getDate() < nasc.getDate()) meses--;
            
            if (meses < 0) meses = 0;

            if (meses <= 6) {
                if (a.sexo === 'Macho') m0_6++; else f0_6++;
            } else if (meses <= 12) {
                if (a.sexo === 'Macho') m7_12++; else f7_12++;
            } else if (meses <= 24) {
                if (a.sexo === 'Macho') m13_24++; else f13_24++;
            } else if (meses <= 36) {
                if (a.sexo === 'Macho') m25_36++; else f25_36++;
            } else {
                if (a.sexo === 'Macho') m36_mais++; else f36_mais++;
            }
        });

        const tbody = document.getElementById('tbody-inventario-view');
        if(tbody) {
            tbody.innerHTML = `
                <tr>
                    <td style="padding: 8px; font-weight: 500; text-align: left;">Até 6 meses (Nascimento)</td>
                    <td style="padding: 4px;">${m0_6}</td>
                    <td style="padding: 4px;">${f0_6}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: 500; text-align: left;">7 a 12 meses (Desmama)</td>
                    <td style="padding: 4px;">${m7_12}</td>
                    <td style="padding: 4px;">${f7_12}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: 500; text-align: left;">13 a 24 meses (Garrote/Novilha)</td>
                    <td style="padding: 4px;">${m13_24}</td>
                    <td style="padding: 4px;">${f13_24}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: 500; text-align: left;">25 a 36 meses (Novilho(a))</td>
                    <td style="padding: 4px;">${m25_36}</td>
                    <td style="padding: 4px;">${f25_36}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: 500; text-align: left;">Acima 36 meses (Boi/Vaca)</td>
                    <td style="padding: 4px;">${m36_mais}</td>
                    <td style="padding: 4px;">${f36_mais}</td>
                </tr>
            `;
        }

        const totalM = m0_6 + m7_12 + m13_24 + m25_36 + m36_mais;
        const totalF = f0_6 + f7_12 + f13_24 + f25_36 + f36_mais;

        const elTotalM = document.getElementById('view-total-m');
        const elTotalF = document.getElementById('view-total-f');
        const elTotalGeral = document.getElementById('view-total-geral');

        if (elTotalM) elTotalM.textContent = totalM;
        if (elTotalF) elTotalF.textContent = totalF;
        if (elTotalGeral) elTotalGeral.textContent = totalM + totalF;

        if (typeof window.openModal === 'function') {
            window.openModal('modal-inventario-view');
        } else {
            document.getElementById('modal-overlay').classList.add('active');
            document.getElementById('modal-inventario-view').classList.add('active');
        }
    } catch (e) {
        console.error("Erro em openInventarioView:", e);
        alert("Erro ao abrir inventário: " + e.message);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const btnInventario = document.getElementById('btn-inventario-view');
    if (btnInventario) {
        btnInventario.addEventListener('click', window.openInventarioView);
    }
});
