// --- MODO CURRAL LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    let curralSession = {
        lote: '',
        contagem: { vaca: 0, boi: 0, bezerro: 0 },
        estimativa: { vaca: 0, boi: 0, bezerro: 0 }
    };

    const loteSelect = document.getElementById('curral-lote-select');
    const btnIniciar = document.getElementById('btn-iniciar-curral');
    const activePanel = document.getElementById('curral-active-panel');
    const btnFinalizar = document.getElementById('btn-finalizar-curral');
    const btnConfirmar = document.getElementById('btn-confirmar-fechamento-curral');

    if(loteSelect && btnIniciar) {
        const navItems = document.querySelectorAll('.sidebar-btn[data-view]');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                if (item.getAttribute('data-view') === 'curral') {
                    updateCurralLotes();
                }
            });
        });

        function updateCurralLotes() {
            const gado = DB.getGado();
            const lotes = [...new Set(gado.map(g => g.lote).filter(l => l))];
            loteSelect.innerHTML = '<option value="">Selecione o Lote / Grupo...</option>' + 
                lotes.map(l => `<option value="${l}">${l}</option>`).join('');
            
            btnIniciar.disabled = true;
            activePanel.style.display = 'none';
            
            curralSession.contagem = { vaca: 0, boi: 0, bezerro: 0 };
            updateCurralUI();
        }

        loteSelect.addEventListener('change', (e) => {
            btnIniciar.disabled = !e.target.value;
        });

        btnIniciar.addEventListener('click', () => {
            curralSession.lote = loteSelect.value;
            const gadoLote = DB.getGado().filter(g => g.lote === curralSession.lote);
            
            curralSession.estimativa = {
                vaca: gadoLote.filter(g => g.sexo === 'Fêmea').length,
                boi: gadoLote.filter(g => g.sexo === 'Macho').length,
                bezerro: 0
            };

            curralSession.contagem = { vaca: 0, boi: 0, bezerro: 0 };
            
            activePanel.style.display = 'block';
            updateCurralUI();
            if(typeof showToast === 'function') showToast('Modo Curral iniciado para ' + curralSession.lote, 'info');
        });

        document.querySelectorAll('.curral-btn-large').forEach(btn => {
            btn.addEventListener('click', () => {
                const tipo = btn.getAttribute('data-tipo');
                curralSession.contagem[tipo]++;
                updateCurralUI();
            });
        });

        function updateCurralUI() {
            document.getElementById('curral-count-vaca').textContent = curralSession.contagem.vaca;
            document.getElementById('curral-count-boi').textContent = curralSession.contagem.boi;
            document.getElementById('curral-count-bezerro').textContent = curralSession.contagem.bezerro;
            
            const totalContado = curralSession.contagem.vaca + curralSession.contagem.boi + curralSession.contagem.bezerro;
            const totalEstimado = curralSession.estimativa.vaca + curralSession.estimativa.boi + curralSession.estimativa.bezerro;
            
            document.getElementById('curral-total-count').textContent = totalContado;
            document.getElementById('curral-estimativa-count').textContent = totalEstimado;
        }

        btnFinalizar.addEventListener('click', () => {
            const diffVaca = curralSession.contagem.vaca - curralSession.estimativa.vaca;
            const diffBoi = curralSession.contagem.boi - curralSession.estimativa.boi;
            const diffBezerro = curralSession.contagem.bezerro - curralSession.estimativa.bezerro;

            const resumoHtml = `
                <p><strong>Lote:</strong> ${curralSession.lote}</p>
                <p><strong>Total Contado:</strong> ${curralSession.contagem.vaca + curralSession.contagem.boi + curralSession.contagem.bezerro}</p>
                <p><strong>Total Estimado:</strong> ${curralSession.estimativa.vaca + curralSession.estimativa.boi + curralSession.estimativa.bezerro}</p>
            `;
            document.getElementById('curral-fechamento-resumo').innerHTML = resumoHtml;

            let alertasHtml = '';
            
            if (diffVaca === 0 && diffBoi === 0 && diffBezerro === 0) {
                alertasHtml = `<div style="color: var(--success); font-weight: 600;"><i class="ph ph-check-circle"></i> Contagem bate exatamente com a estimativa do sistema!</div>`;
            } else {
                if (diffVaca > 0) alertasHtml += `<div style="color: var(--warning); margin-bottom: 0.5rem;"><i class="ph ph-warning"></i> +${diffVaca} Vaca(s) não estavam neste lote. (Serão adicionadas como Ajuste de Estoque)</div>`;
                else if (diffVaca < 0) alertasHtml += `<div style="color: var(--danger); margin-bottom: 0.5rem;"><i class="ph ph-warning-circle"></i> Faltam ${Math.abs(diffVaca)} Vaca(s). (Serão removidas)</div>`;

                if (diffBoi > 0) alertasHtml += `<div style="color: var(--warning); margin-bottom: 0.5rem;"><i class="ph ph-warning"></i> +${diffBoi} Boi(s) não estavam neste lote. (Serão adicionados como Ajuste de Estoque)</div>`;
                else if (diffBoi < 0) alertasHtml += `<div style="color: var(--danger); margin-bottom: 0.5rem;"><i class="ph ph-warning-circle"></i> Faltam ${Math.abs(diffBoi)} Boi(s). (Serão removidos)</div>`;

                if (diffBezerro > 0) alertasHtml += `<div style="color: var(--info); margin-bottom: 0.5rem;"><i class="ph ph-info"></i> +${diffBezerro} Bezerro(s) encontrados. (Serão adicionados como Nascimento)</div>`;
            }

            document.getElementById('curral-fechamento-alertas').innerHTML = alertasHtml;
            if(typeof openModal === 'function') openModal('modal-fechamento-curral');
        });

        btnConfirmar.addEventListener('click', () => {
            const diffVaca = curralSession.contagem.vaca - curralSession.estimativa.vaca;
            const diffBoi = curralSession.contagem.boi - curralSession.estimativa.boi;
            const diffBezerro = curralSession.contagem.bezerro - curralSession.estimativa.bezerro;

            const gadoLote = DB.getGado().filter(g => g.lote === curralSession.lote);

            if (diffVaca < 0) {
                const femeas = gadoLote.filter(g => g.sexo === 'Fêmea');
                for(let i=0; i<Math.abs(diffVaca) && i<femeas.length; i++) {
                    DB.deleteGado(femeas[i].id);
                }
            }
            if (diffBoi < 0) {
                const machos = gadoLote.filter(g => g.sexo === 'Macho');
                for(let i=0; i<Math.abs(diffBoi) && i<machos.length; i++) {
                    DB.deleteGado(machos[i].id);
                }
            }

            if (diffVaca > 0) {
                for(let i=0; i<diffVaca; i++) {
                    DB.addGado({ brinco: 'S/N (Ajuste)', lote: curralSession.lote, sexo: 'Fêmea', nascimento: '', peso: 0, situacao: 'Ativo no Pasto', observacao: 'Ajuste Curral' });
                }
            }
            if (diffBoi > 0) {
                for(let i=0; i<diffBoi; i++) {
                    DB.addGado({ brinco: 'S/N (Ajuste)', lote: curralSession.lote, sexo: 'Macho', nascimento: '', peso: 0, situacao: 'Ativo no Pasto', observacao: 'Ajuste Curral' });
                }
            }
            if (diffBezerro > 0) {
                for(let i=0; i<diffBezerro; i++) {
                    DB.addBezerro({ nascimento: new Date().toISOString().split('T')[0], mae: curralSession.lote, sexo: 'Misto', peso: 0, observacoes: 'Nascimento via Curral' });
                }
            }

            if(typeof closeModal === 'function') closeModal();
            if(typeof showToast === 'function') showToast('Estoque ajustado e salvo com sucesso.', 'success');
            
            activePanel.style.display = 'none';
            btnIniciar.disabled = true;
            loteSelect.value = '';
            updateCurralLotes();
            
            if (typeof window.updateDashboard === 'function') window.updateDashboard();
            if (typeof window.renderGado === 'function') window.renderGado();
            if (typeof window.renderBezerros === 'function') window.renderBezerros();
        });
    }
});
