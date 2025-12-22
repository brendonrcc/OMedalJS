    function toggleTurbo() {
        const body = document.body;
        const btn = document.getElementById('turbo-btn');
        body.classList.toggle('turbo-mode');
        const isActive = body.classList.contains('turbo-mode');
        if (isActive) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
        localStorage.setItem('om_turbo_mode', isActive);
    }

    window.addEventListener('DOMContentLoaded', () => {
        const isTurbo = localStorage.getItem('om_turbo_mode') === 'true';
        if(isTurbo) {
            document.body.classList.add('turbo-mode');
            if(document.getElementById('turbo-btn')) {
                document.getElementById('turbo-btn').classList.add('active');
            }
        }
        init(); 
        
        const ySelect = document.getElementById('lid-year');
        if(ySelect) {
            const currentY = new Date().getFullYear();
            for(let y = currentY; y >= 2023; y--) {
                ySelect.innerHTML += `<option value="${y}">${y}</option>`;
            }
        }
        

        const mSelect = document.getElementById('lid-month');
        if(mSelect) {
            mSelect.value = String(new Date().getMonth() + 1).padStart(2, '0');
        }
    });


    function switchView(viewName) {
        document.getElementById('view-metas').classList.add('hidden-view');
        document.getElementById('view-medalhas').classList.add('hidden-view');
        document.getElementById('tab-metas').classList.remove('active');
        document.getElementById('tab-medalhas').classList.remove('active');

        document.getElementById(`view-${viewName}`).classList.remove('hidden-view');
        document.getElementById(`tab-${viewName}`).classList.add('active');

        if(viewName === 'medalhas' && medalData.length === 0) {
            initMedalSystem();
        }
    }

    function toggleMedalSubTab(tab) {
        const generalView = document.getElementById('subview-general');
        const leadView = document.getElementById('subview-leadership');
        const minView = document.getElementById('subview-ministry');

        const tabGen = document.getElementById('subtab-general');
        const tabLead = document.getElementById('subtab-leadership');
        const tabMin = document.getElementById('subtab-ministry');

        generalView.classList.add('hidden');
        leadView.classList.add('hidden');
        if(minView) minView.classList.add('hidden');
        
        tabGen.classList.remove('active');
        tabLead.classList.remove('active');
        if(tabMin) tabMin.classList.remove('active');

        if(tab === 'general') {
            generalView.classList.remove('hidden');
            tabGen.classList.add('active');
        } else if (tab === 'leadership') {
            leadView.classList.remove('hidden');
            tabLead.classList.add('active');
        } else if (tab === 'ministry') {
            if(minView) minView.classList.remove('hidden');
            if(tabMin) tabMin.classList.add('active');
            if(Object.keys(membersCache).length === 0) fetchMembersData();
        }
    }

    function showToast(message, type = 'info', title = '') {
        const container = document.getElementById('toast-container');
        const config = {
            success: { icon: 'fa-check-circle', title: 'Sucesso' },
            error: { icon: 'fa-times-circle', title: 'Erro' },
            warning: { icon: 'fa-exclamation-triangle', title: 'Atenção' },
            info: { icon: 'fa-info-circle', title: 'Informação' }
        };
        
        const style = config[type] || config.info;
        const finalTitle = title || style.title;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon-box">
                <i class="fas ${style.icon}"></i>
            </div>
            <div class="toast-content">
                <span class="toast-title">${finalTitle}</span>
                <span class="toast-msg">${message}</span>
            </div>
        `;
        
        container.appendChild(toast);
        void toast.offsetWidth;
        toast.classList.add('visible');
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 500); 
        }, 4000);
    }

    function showCustomConfirm(title, message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-modal');
            const titleEl = document.getElementById('modal-title');
            const descEl = document.getElementById('modal-desc');
            const confirmBtn = document.getElementById('modal-confirm');
            const cancelBtn = document.getElementById('modal-cancel');

            titleEl.textContent = title;
            descEl.innerHTML = message; 
            modal.classList.add('open');

            const close = (val) => {
                modal.classList.remove('open');
                resolve(val);
                confirmBtn.onclick = null;
                cancelBtn.onclick = null;
            };
            confirmBtn.onclick = () => close(true);
            cancelBtn.onclick = () => close(false);
        });
    }

    const LEADERSHIP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxHypeBU-eM4pEUpkUNP68WWkR_SnoGrKGqz5P6Z30IzgLpX5MhTJ3hyPYkewWf01jKNg/exec";
    
    let leadershipLeaves = [];
    let leadershipReturns = [];

    async function loadLeadershipData() {
        const year = document.getElementById('lid-year').value;
        const month = document.getElementById('lid-month').value;
        const grid = document.getElementById('leadership-grid');

        if(!year || !month) { showToast("Selecione Ano e Mês.", "warning"); return; }

        grid.innerHTML = '<div class="col-span-full text-center py-12"><i class="fas fa-circle-notch fa-spin text-4xl text-ocean-mid mb-3"></i><p class="text-slate-500 font-bold animate-pulse">Consultando base de dados...</p></div>';

        try {
            await fetchMembersData(); 
            const leaders = Object.entries(membersCache).filter(([nickKey, data]) => {
                const role = data.cargo.toLowerCase();
                return role.includes('líder') || role.includes('lider'); 
            });

            console.log("Iniciando fetch do Macro...");
            const response = await fetch(LEADERSHIP_SCRIPT_URL);
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
            }

            const textResponse = await response.text();
            let jsonData;
            try {
                jsonData = JSON.parse(textResponse);
            } catch (jsonError) {
                console.error("O Google não retornou JSON. Retornou:", textResponse);
                throw new Error("A resposta da planilha não é um JSON válido. Verifique o Script.");
            }

            if (jsonData.status !== 'success') {
                throw new Error("O script retornou status de erro interna.");
            }
            
            parseLeavesFromJSON(jsonData.licencas);
            parseReturnsFromJSON(jsonData.retornos);

            if(leaders.length === 0) {
                grid.innerHTML = '<div class="col-span-full text-center text-slate-400 p-8 border border-dashed border-slate-300 rounded-xl">Nenhum membro da liderança encontrado.</div>';
                return;
            }

            let html = '';
            leaders.forEach(([nickKey, data]) => {
                const displayNick = data.displayNick || nickKey; 
                
                const isBoss = !data.cargo.toLowerCase().includes('vice');
                const roleClass = isBoss ? 'boss' : '';
                const avatar = `https://www.habbo.com.br/habbo-imaging/avatarimage?user=${nickKey}&headonly=1&size=l`;
                
                html += `
                <div class="leader-card-new" onclick="openLeaderDetails('${displayNick}', '${data.cargo}', '${month}', '${year}')">
                    <div class="leader-bg-pattern"></div>
                    <div class="leader-avatar-frame">
                        <img src="${avatar}" onerror="this.src='https://i.imgur.com/S1tKqgc.gif'">
                    </div>
                    <div class="leader-info-container">
                        <span class="leader-name">${displayNick}</span>
                        <span class="leader-badge ${roleClass}">${data.cargo}</span>
                        <div class="leader-action">
                            <span class="btn-view-details">
                                <i class="fas fa-chart-pie"></i> Ver Relatório
                            </span>
                        </div>
                    </div>
                </div>`;
            });
            
            grid.innerHTML = html;

        } catch (e) {
            console.error("ERRO FATAL:", e);
            showToast("Erro técnico: " + e.message, "error");
            grid.innerHTML = `<div class="col-span-full text-center text-red-500 font-bold bg-red-50 p-6 rounded-xl border border-red-100"><i class="fas fa-bug mb-2 text-2xl"></i><br>${e.message}</div>`;
        }
    }

    function parseLeavesFromJSON(rows) {
        leadershipLeaves = [];
        if(!rows || !Array.isArray(rows)) return;

        for(let i=0; i<rows.length; i++) {
            const r = rows[i];
            if(!r || r.length < 4) continue;
            
            const rawDate = String(r[0]); 
            const nick = String(r[2]).trim().toLowerCase();
            const days = parseInt(r[3]) || 0;

            leadershipLeaves.push({
                rawDate: rawDate,
                parsedDate: parseDateCustom(rawDate),
                nick: nick,
                days: days
            });
        }
    }

    function parseReturnsFromJSON(rows) {
        leadershipReturns = [];
        if(!rows || !Array.isArray(rows)) return;

        for(let i=0; i<rows.length; i++) {
            const r = rows[i];
            if(!r || r.length < 2) continue;

            const rawDate = String(r[0]);
            const nick = String(r[1]).trim().toLowerCase();

            leadershipReturns.push({
                rawDate: rawDate,
                parsedDate: parseDateCustom(rawDate),
                nick: nick
            });
        }
    }

    function parseDateCustom(str) {
        if(!str) return null;
        if (str instanceof Date) return str;

        const stringVal = String(str).trim();

        const match = stringVal.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);

        if (match) {
            const day = parseInt(match[1], 10);
            const month = parseInt(match[2], 10) - 1; 
            const year = parseInt(match[3], 10);
            return new Date(year, month, day, 12, 0, 0);
        }
        
        const isoMatch = stringVal.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
        if (isoMatch) {
             const year = parseInt(isoMatch[1], 10);
             const month = parseInt(isoMatch[2], 10) - 1;
             const day = parseInt(isoMatch[3], 10);
             return new Date(year, month, day, 12, 0, 0);
        }

        const nativeDate = new Date(stringVal);
        if(!isNaN(nativeDate.getTime())) return nativeDate;

        return null;
    }

    // --- LOGICA REVISADA DE DETALHES DE LIDERANÇA COM MODO MANUAL ---
    async function openLeaderDetails(nick, role, month, year) {
        const modal = document.getElementById('custom-modal');
        const titleEl = document.getElementById('modal-title');
        const descEl = document.getElementById('modal-desc');
        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');
        
        titleEl.innerHTML = `Relatório de Liderança`;

        // Renderiza estrutura base do modal com Toggle e Inputs
        descEl.innerHTML = `
            <div id="leadership-calc-container" class="font-sans">
                <!-- Toggle Mode -->
                <div class="toggle-container">
                    <div class="toggle-opt active" onclick="setLeaderCalcMode('auto')" id="opt-auto">Automático</div>
                    <div class="toggle-opt" onclick="setLeaderCalcMode('manual')" id="opt-manual">Manual</div>
                </div>

                <!-- Manual Inputs (Hidden by default) -->
                <div id="manual-inputs" class="hidden manual-inputs-container bg-amber-50 p-4 rounded-xl border border-amber-100 mb-4">
                     <p class="text-[10px] font-bold text-amber-500 uppercase tracking-wide mb-2">Inserção Manual de Dados</p>
                     <div class="grid grid-cols-2 gap-3">
                         <div>
                             <label class="text-xs font-bold text-slate-500 block mb-1">Início da Licença</label>
                             <input type="date" id="manual-start-date" class="form-input text-xs py-1" onchange="recalculateLeadership()">
                         </div>
                         <div>
                             <label class="text-xs font-bold text-slate-500 block mb-1">Data do Retorno</label>
                             <input type="date" id="manual-return-date" class="form-input text-xs py-1" onchange="recalculateLeadership()">
                         </div>
                     </div>
                </div>

                <!-- Results Container -->
                <div id="leader-results-area">
                    <div class="p-8 text-center text-slate-400">
                        <i class="fas fa-circle-notch fa-spin"></i> Calculando...
                    </div>
                </div>
            </div>
        `;
        
        // Define função global temporária para recalculo
        window.currentLeaderParams = { nick, role, month, year };
        
        window.setLeaderCalcMode = (mode) => {
            const optAuto = document.getElementById('opt-auto');
            const optManual = document.getElementById('opt-manual');
            const manualInputs = document.getElementById('manual-inputs');
            
            if(mode === 'auto') {
                optAuto.classList.add('active');
                optManual.classList.remove('active');
                manualInputs.classList.add('hidden');
            } else {
                optAuto.classList.remove('active');
                optManual.classList.add('active');
                manualInputs.classList.remove('hidden');
            }
            window.currentLeaderMode = mode;
            recalculateLeadership();
        };

        window.recalculateLeadership = () => {
            const { nick, role, month, year } = window.currentLeaderParams;
            const mode = window.currentLeaderMode || 'auto';
            const resultsArea = document.getElementById('leader-results-area');
            
            // Dados manuais
            const manualStartVal = document.getElementById('manual-start-date').value;
            const manualReturnVal = document.getElementById('manual-return-date').value;

            // Lógica de Datas
            const monthIndex = parseInt(month) - 1; 
            const targetYear = parseInt(year);
            const firstDayOfMonth = new Date(targetYear, monthIndex, 1, 12, 0, 0);
            const lastDayOfMonth = new Date(targetYear, monthIndex + 1, 0, 12, 0, 0);
            const daysInMonth = lastDayOfMonth.getDate();
            const fullMonthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
            const periodStr = `01/${month}/${targetYear} a ${daysInMonth}/${month}/${targetYear}`;
            
            let leaves = [];
            let returnDate = null;
            
            if (mode === 'auto') {
                // Lógica Original (Automática)
                leaves = leadershipLeaves.filter(l => {
                    if (!l.parsedDate) return false;
                    const lNick = l.nick.trim().toLowerCase();
                    const targetNick = nick.trim().toLowerCase();
                    const isSameMonth = l.parsedDate.getMonth() === monthIndex && l.parsedDate.getFullYear() === targetYear;
                    return lNick === targetNick && isSameMonth;
                });

                if (leaves.length > 0) {
                    const leave = leaves[leaves.length - 1];
                    const leaveDate = new Date(leave.parsedDate);
                    leaveDate.setHours(12,0,0,0);
                    
                    const returns = leadershipReturns.filter(r => {
                        if (!r.parsedDate) return false;
                        const rNick = r.nick.trim().toLowerCase();
                        const targetNick = nick.trim().toLowerCase();
                        if (rNick !== targetNick) return false;
                        return r.parsedDate.getTime() > leaveDate.getTime();
                    });

                    if (returns.length > 0) {
                        const ret = returns.sort((a,b) => a.parsedDate - b.parsedDate)[0];
                        returnDate = new Date(ret.parsedDate);
                        returnDate.setHours(12,0,0,0);
                    }
                }
            } else {
                // Lógica Manual
                if(manualStartVal) {
                    const partsStart = manualStartVal.split('-');
                    const mStart = new Date(partsStart[0], partsStart[1]-1, partsStart[2], 12, 0, 0);
                    // Mockar objeto de licença
                    leaves.push({
                        parsedDate: mStart, // Data da postagem da licença
                        days: 30 // Assumir 30 dias padrão se não especificado, ou até o retorno
                    });
                }
                if(manualReturnVal) {
                    const partsRet = manualReturnVal.split('-');
                    returnDate = new Date(partsRet[0], partsRet[1]-1, partsRet[2], 12, 0, 0);
                }
            }

            // Cálculo de Dias
            let absentDaysCount = 0;
            let activeDaysCount = daysInMonth; 
            let statusColor = 'emerald';
            let statusTitle = 'Mês Completo';
            let statusIcon = 'fa-check-circle';
            let leaveInfo = `<span class="opacity-60">Nenhuma ausência registrada neste mês.</span>`;

            if (leaves.length > 0) {
                const leave = leaves[leaves.length - 1];
                const leaveDate = new Date(leave.parsedDate); // Data Postagem
                leaveDate.setHours(12,0,0,0);

                const effectiveAbsenceStart = new Date(leaveDate);
                effectiveAbsenceStart.setDate(leaveDate.getDate() + 1); // Conta a partir do dia seguinte

                // Se manual, podemos não ter 'days', então assumimos infinito até retorno
                const requestedDays = leave.days || 30; 
                const expectedAbsenceEnd = new Date(leaveDate);
                expectedAbsenceEnd.setDate(leaveDate.getDate() + requestedDays);

                absentDaysCount = 0;
                
                for (let d = 1; d <= daysInMonth; d++) {
                    let currentDayCheck = new Date(targetYear, monthIndex, d, 12, 0, 0);

                    const isAfterStart = currentDayCheck.getTime() >= effectiveAbsenceStart.getTime();
                    // Se manual e sem retorno definido, assume ausência até o fim do mês
                    const isWithinDuration = (mode === 'manual' && !returnDate) ? true : (currentDayCheck.getTime() <= expectedAbsenceEnd.getTime());
                    const isBeforeReturn = returnDate ? (currentDayCheck.getTime() < returnDate.getTime()) : true;

                    if (isAfterStart && isWithinDuration && isBeforeReturn) {
                        absentDaysCount++;
                    }
                }

                activeDaysCount = daysInMonth - absentDaysCount;
                if(activeDaysCount < 0) activeDaysCount = 0; // Proteção

                if (activeDaysCount < daysInMonth) {
                    statusColor = returnDate ? 'blue' : 'amber';
                    statusTitle = returnDate ? 'Retorno Processado' : 'Em Licença';
                    statusIcon = returnDate ? 'fa-check-circle' : 'fa-clock';

                    leaveInfo = `
                    <div class="flex flex-col gap-1">
                        <div class="flex justify-between text-xs border-b border-slate-100 pb-1">
                            <span class="font-bold text-slate-500">Início:</span>
                            <span class="font-mono text-slate-700">${effectiveAbsenceStart.toLocaleDateString('pt-BR')}</span>
                        </div>
                        ${returnDate ? `
                        <div class="flex justify-between text-xs">
                            <span class="font-bold text-blue-600">Retorno:</span>
                            <span class="font-mono text-slate-700">${returnDate.toLocaleDateString('pt-BR')}</span>
                        </div>` : 
                        `<div class="text-[10px] text-amber-600 font-bold uppercase tracking-wide text-center mt-1 bg-amber-50 rounded py-1">Sem retorno no mês</div>`}
                        
                        <div class="flex justify-between text-xs mt-1 pt-1 border-t border-slate-100">
                            <span class="font-bold text-red-400">Descontado(s): </span>
                            <span class="font-mono font-bold text-red-500">${absentDaysCount} dias.</span>
                        </div>
                    </div>`;
                }
            }

            let finalMedals = Math.round((65 * activeDaysCount) / daysInMonth);
            if (finalMedals < 0) finalMedals = 0;
            if (finalMedals > 65) finalMedals = 65;

            const avatarUrl = `https://www.habbo.com.br/habbo-imaging/avatarimage?user=${nick}&action=std&direction=2&head_direction=3&gesture=sml&size=l`;

            // Render Results HTML
            resultsArea.innerHTML = `
                <div class="flex items-center gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-3 opacity-10">
                        <i class="fas fa-chart-pie text-6xl text-slate-800"></i>
                    </div>
                    <div class="modal-avatar-glow shrink-0">
                        <img src="${avatarUrl}" class="w-16 h-16 object-contain drop-shadow-md transform scale-125 -mb-2">
                    </div>
                    <div class="flex-1 relative z-10">
                        <h4 class="text-xl font-extrabold text-slate-700 leading-tight">${nick}</h4>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                                ${role}
                            </span>
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-${statusColor}-100 text-${statusColor}-600 border border-${statusColor}-200 flex items-center gap-1">
                                <i class="fas ${statusIcon}"></i> ${statusTitle}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-3 mb-4">
                    <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center flex flex-col justify-center">
                        <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mês</span>
                        <span class="text-xl font-bold text-slate-700">${daysInMonth}</span>
                        <span class="text-[9px] text-slate-400">dias totais</span>
                    </div>

                    <div class="p-3 ${absentDaysCount > 0 ? 'bg-red-50 border-red-100 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-400'} border rounded-xl text-center flex flex-col justify-center transition-colors">
                        <span class="text-[10px] uppercase font-bold opacity-70 tracking-wider">Ausente</span>
                        <span class="text-xl font-bold">${absentDaysCount}</span>
                        <span class="text-[9px] opacity-70">dias off</span>
                    </div>

                    <div class="p-3 bg-white border-2 border-ocean-light/30 rounded-xl text-center flex flex-col justify-center shadow-sm relative overflow-hidden">
                        <div class="absolute inset-0 bg-ocean-light/5"></div>
                        <span class="text-[10px] uppercase font-bold text-ocean-mid tracking-wider relative">Ativos</span>
                        <span class="text-xl font-bold text-ocean-dark relative">${activeDaysCount}</span>
                        <span class="text-[9px] text-ocean-mid/70 relative">dias úteis</span>
                    </div>
                </div>

                <div class="mb-5 flex flex-col md:flex-row gap-3">
                    <div class="flex-1 rounded-xl border border-slate-100 p-3 bg-white text-sm relative">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">
                            Detalhamento
                        </p>
                        ${leaveInfo}
                    </div>
                    <div class="flex-1 rounded-xl border border-slate-100 p-3 bg-slate-50 flex flex-col justify-center items-center text-center">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cálculo Proporcional</p>
                        <div class="text-xs font-mono text-slate-600 bg-white px-2 py-1 rounded border border-slate-200 mb-1">
                            (65 × ${activeDaysCount}) ÷ ${daysInMonth}
                        </div>
                        <span class="text-[10px] text-slate-400">= ${((65 * activeDaysCount) / daysInMonth).toFixed(2)}</span>
                    </div>
                </div>

                <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-[#1C2A30] text-white p-5 shadow-lg flex items-center justify-between group">
                    <div class="absolute -right-6 -top-10 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl group-hover:bg-yellow-400/30 transition-all"></div>
                    <div class="relative z-10">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Resultado Final</p>
                        <p class="text-xs text-slate-300 opacity-80 font-light">Ref: ${fullMonthNames[monthIndex]}/${targetYear}</p>
                    </div>
                    <div class="flex flex-col items-end relative z-10">
                        <div class="flex items-baseline gap-1">
                            <span class="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-500 drop-shadow-sm filter">
                                ${finalMedals}
                            </span>
                        </div>
                        <span class="text-[10px] font-bold text-yellow-500 uppercase tracking-widest bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">Medalhas</span>
                    </div>
                </div>
            `;
            
            // Atualiza comportamento do botão confirmar com os dados recalculados
            const motivoGrat = `Cumprimento de meta do cargo de`;
            confirmBtn.style.display = 'inline-flex';
            confirmBtn.className = "btn-modal btn-modal-confirm flex items-center gap-2";
            confirmBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>Postar</span>';
            
            confirmBtn.onclick = () => {
                const responsible = document.getElementById('lid-responsible').value;
                if(!responsible) {
                    showToast("Preencha o campo 'Responsável' na aba anterior.", "warning");
                    return;
                }
                const params = new URLSearchParams({
                    responsavel_med: responsible,
                    grupo_tarefas: "Escola de Formação de Executivos", 
                    periodo_med: periodStr,
                    gratificados_med: nick,
                    numero_med: finalMedals,
                    cargo_med: role,
                    motivo_grat: motivoGrat
                });
                window.open(`https://www.policiarcc.com/h17-postagem-de-medalhas-af?${params.toString()}`, '_blank');
            };
        };

        // Inicia
        cancelBtn.innerText = 'Fechar';
        cancelBtn.onclick = () => { modal.classList.remove('open'); };
        setLeaderCalcMode('auto'); // Start auto
        modal.classList.add('open');
    }

    let forceBypassCache = false;

    async function fetchSmart(targetUrl, isGViz = false) {
        const cacheKey = `EFE_CACHE_V2_${targetUrl}`;
        
        if (!forceBypassCache) {
            try {
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    const entry = JSON.parse(cached);
                    if (Date.now() - entry.timestamp < CACHE_DURATION_MS) return entry.data;
                }
            } catch(e) { console.warn("Cache read error", e); }
        }

        const proxies = [
            (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
            (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
            (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}` 
        ];
        
        for (const proxyGen of proxies) {
            try {
                let finalUrl = proxyGen(targetUrl);
                if (forceBypassCache) {
                    finalUrl += (finalUrl.includes('?') ? '&' : '?') + 't_buster=' + Date.now();
                }

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

                const resp = await fetch(finalUrl, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                
                const text = await resp.text();
            
                if (text && text.length > 30 && !text.includes('Access Denied') && !text.includes('404 Not Found')) {
                    try { localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: text })); } catch(e) {}
                    return text;
                }
                throw new Error("Resposta vazia ou inválida");
            } catch (err) { 
                console.warn(`Proxy falhou: ${proxyGen(targetUrl).split('?')[0]}`, err); 
            }
        }
        throw new Error("Falha na conexão. Tente novamente.");
    }

    async function reloadMetas() {
        const btn = event.currentTarget;
        const icon = btn.querySelector('i');
        icon.classList.add('fa-spin');
        
        try {
            forceBypassCache = true;
            if(currentRankKey) {
                const config = RANK_CONFIG[currentRankKey];
                const masterUrl = `${MASTER_BASE_URL}?gid=${config.gid}&output=tsv`;
                localStorage.removeItem(`EFE_CACHE_V2_${masterUrl}`);
            }
            const membersUrl = `https://docs.google.com/spreadsheets/d/${MEMBERS_SHEET_ID}/export?gid=${MEMBERS_GID}&format=tsv`;
            localStorage.removeItem(`EFE_CACHE_V2_${membersUrl}`);
            membersCache = {};

            if(els.titleSelect.value && !els.titleSelect.disabled) {
                const targetUrl = els.titleSelect.value;
                const idMatch = targetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
                if(idMatch) {
                    const gvizUrl = `https://docs.google.com/spreadsheets/d/${idMatch[1]}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(TARGET_SHEET_NAME)}`;
                    localStorage.removeItem(`EFE_CACHE_V2_${gvizUrl}`);
                    await fetchAndRenderTarget(targetUrl);
                }
            } else {
                await selectRank(currentRankKey);
            }
            showToast("Dados atualizados instantaneamente.", "success");
        } catch(e) {
            console.error("Erro ao recarregar metas:", e);
            showToast("Erro ao recarregar dados.", "error");
        } finally {
            icon.classList.remove('fa-spin');
            forceBypassCache = false;
        }
    }

    async function reloadMedals() {
        const btn = event.currentTarget;
        const icon = btn.querySelector('i');
        icon.classList.add('fa-spin');
        
        try {
            forceBypassCache = true;
            const url = `https://docs.google.com/spreadsheets/d/${MEDAL_SHEET_ID}/export?gid=${MEDAL_GID}&format=tsv`;
            const cacheKey = `EFE_CACHE_V2_${url}`;
            localStorage.removeItem(cacheKey);

            await initMedalSystem();
            showToast("Dados de medalhas atualizados!", "success");
        } catch (e) {
            console.error(e);
            showToast("Erro ao atualizar medalhas.", "error");
        } finally {
            icon.classList.remove('fa-spin');
            forceBypassCache = false;
        }
    }

    async function getOceanMPTemplate(status, cargo, nick) {
        let subject = "";
        let message = "";
        const today = new Date().toLocaleDateString('pt-BR');

        if (status === 'Positivo') {
            subject = `[EFE] Gratificação de Metas - ${cargo}`;
            message = `Olá, [b]${nick}[/b]!\n\nParabéns! Constatamos que você cumpriu sua meta como [b]${cargo}[/b] nesta semana.\n\nSua medalha de gratificação já foi solicitada. Continue com o excelente trabalho!\n\nAtenciosamente,\n[b]Liderança EFE[/b]`;
            return { subject, message };
        }
        else if (status === 'Negativo') {
            // Lógica modificada para usar o BBCode específico e a regra de exceção para Professor
            const isProfessor = cargo.toLowerCase().includes('professor');
            
            // Configuração das variáveis baseada no cargo
            let tipoCarta = "META NÃO CUMPRIDA";
            let infracao = `não cumprimento da meta obrigatória referente ao cargo de [b]${cargo}[/b]`;
            let medalhas = "15 Medalhas Efetivas Negativas"; // Padrão
            let advertenciaTexto = " e uma Advertência Interna";

            // Se for Professor, não recebe Advertência Interna, apenas notificação e desconto
            if (isProfessor) {
                tipoCarta = "META NÃO CUMPRIDA"; 
                medalhas = "10 Medalhas Efetivas Negativas"; // Professor geralmente perde 10
                advertenciaTexto = ""; // Remove o texto da advertência
            } else if (cargo.toLowerCase().includes('graduador')) {
                medalhas = "25 Medalhas Efetivas Negativas";
            }
            
            // Novo BBCode conforme solicitado
            const bbcode = `[font=Poppins][table style="border: none!important; border-radius: 15px; width: auto; margin: 0 auto; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);" bgcolor="#79a8c3"][tr style="border: none!important"][td style="border: none!important; padding: 7px"][table style="border: none!important; width: 100%; border-radius: 15px;" bgcolor="#25313a"][tr style="border: none!important"][td style="border: none!important; padding: 14px"][img]https://i.imgur.com/S1tKqgc.gif[/img]
[table style="border: none!important; border-radius: 40px; width: 40%; margin: -2% auto; position: relative;" bgcolor="79a8c3"][tr style="border: none!important"][td style="border: none!important"][center][color=white][b][size=16]CARTA DE ${tipoCarta}[/size][/b][/color][/center]
[/td][/tr][/table][table style="border: none!important; width: 100%; border-radius: 15px; line-height: 1.4em;" bgcolor="f8f8ff"][tr style="border: none!important"][td style="border: none!important"]
Saudações, [color=#79a8c3][b]{USERNAME}[/b][/color]

[justify]Venho informar que você está sendo punido(a) por ${infracao} na [b][color=#79a8c3]Escola de Formação de Executivos[/color][/b]. A penalização aplicada será: [color=#79a8c3][b]${medalhas}${advertenciaTexto}[/b][/color].[/justify]

[/td][/tr][/table]
[size=11][color=white]Desenvolvido por [b]Brendon[/b] | Todos os direitos reservados à [b]Escola de Formação de Executivos[/b].[/color][/size]
[/td][/tr][/table][/td][/tr][/table][/font]`;

            return {
                subject: `[EFE] ${tipoCarta} - LEIA!`,
                message: bbcode
            };
        }
        else return null; 
    }

    // 2. Envia a MP
    async function sendPrivateMessage(username, subject, message) {
        try {
            const composeResp = await fetch('/privmsg?mode=post', {
                credentials: 'same-origin',
                headers: { 'Cache-Control': 'no-store, no-cache' }
            });

            if (!composeResp.ok) {
                console.error(`Falha ao abrir formulário de MP. Status: ${composeResp.status}`);
                return false;
            }

            const html = await composeResp.text();
            const dom = new DOMParser().parseFromString(html, 'text/html');
            const form = dom.querySelector('form[action*="/privmsg"]');
            
            if (!form) {
                console.error('Formulário de MP não encontrado.');
                return false;
            }

            const formData = new FormData();
            let hasUsernameArrayField = false;

            form.querySelectorAll('input, textarea, select').forEach(el => {
                const name = el.getAttribute('name');
                if (!name) return;
                if (name === 'username[]') hasUsernameArrayField = true;
                if (['message', 'subject', 'post', 'preview'].includes(name)) return; 
                if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) return;
                formData.append(name, el.value || '');
            });

            if (hasUsernameArrayField) formData.set('username[]', username);
            else formData.set('username', username);

            formData.set('subject', subject);
            formData.set('message', message);
            formData.set('post', '1'); 

            const action = form.getAttribute('action') || '/privmsg';

            const sendResp = await fetch(action, {
                method: 'POST', body: formData, credentials: 'same-origin'
            });

            if (!sendResp.ok) return false;

            const responseText = await sendResp.text();
            const textLower = responseText.toLowerCase();

            if (textLower.includes('usuário requerido não existe') || textLower.includes('o usuário requerido não existe')) {
                return 'USER_NOT_FOUND';
            }
            if (textLower.includes('flood') || textLower.includes('muito rapidamente')) {
                return 'FLOOD';
            }

            return 'OK';

        } catch (error) {
            console.error('Erro de rede:', error);
            return false;
        }
    }

    function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }


    // --- LÓGICA DE MEDALHAS & BOTÕES ---
    const MEDAL_SHEET_ID = "1rfO0LHwXzRQnKfDvD4yVkVboEGG_OXFtpXHXBi3MFAY";
    const MEDAL_GID = "1008047655";
    let medalData = []; 

    async function initMedalSystem() {
        const dateSelect = document.getElementById('med-date');
        dateSelect.innerHTML = '<option value="">Carregando...</option>';
        dateSelect.disabled = true;
        try {
            const url = `https://docs.google.com/spreadsheets/d/${MEDAL_SHEET_ID}/export?gid=${MEDAL_GID}&format=tsv`;
            const text = await fetchSmart(url); 
            parseMedalData(text);
        } catch (e) {
            showToast("Erro ao carregar planilha: " + e.message, "error");
            dateSelect.innerHTML = '<option value="">Erro</option>';
        } finally {
            resetDateSelect();
        }
    }

    function parseMedalData(tsvText) {
        const rows = tsvText.split('\n').map(l => l.split('\t')).filter(r => r.length > 1);
        medalData = [];
        for(let i=1; i<rows.length; i++) {
            const col = rows[i];
            if(col.length < 4) continue;
            const dataRef = col[0]?.trim();
            const cargo = col[1]?.trim(); 
            const status = col[2]?.trim(); 
            const nick = col[3]?.trim(); 
            if(dataRef && cargo && status && nick) medalData.push({ dataRef, cargo, status, nick });
        }
    }

    function resetDateSelect() {
        const dateSelect = document.getElementById('med-date');
        dateSelect.innerHTML = '<option value="">Selecione o Cargo...</option>';
        dateSelect.disabled = true;
    }

    function updateDateOptions() {
        const role = document.getElementById('med-role').value;
        const dateSelect = document.getElementById('med-date');
        document.getElementById('med-result').innerText = "";
        document.getElementById('med-count').innerText = "0 encontrados";
        document.getElementById('btn-medal-link').disabled = true;
        document.getElementById('btn-punishment').classList.add('hidden');
        document.getElementById('btn-mp').classList.add('hidden');
        document.getElementById('inactive-result-container').classList.add('hidden');

        if (!role) { resetDateSelect(); return; }

        const availableDates = new Set();
        medalData.forEach(r => { if (r.cargo.includes(role)) availableDates.add(r.dataRef); });

        dateSelect.innerHTML = '<option value="">Selecione a data...</option>';
        if (availableDates.size === 0) {
            dateSelect.innerHTML += '<option value="" disabled>Nenhuma data</option>';
        } else {
            const sortedDates = Array.from(availableDates).sort().reverse();
            sortedDates.forEach(d => dateSelect.innerHTML += `<option value="${d}">${d}</option>`);
            dateSelect.disabled = false;
        }
        filterMedalData();
    }

    function filterMedalData() {
        const role = document.getElementById('med-role').value;
        const status = document.getElementById('med-status').value;
        const date = document.getElementById('med-date').value;
        const resultArea = document.getElementById('med-result');
        const countDiv = document.getElementById('med-count');
        const btnMedal = document.getElementById('btn-medal-link');
        const btnWarn = document.getElementById('btn-punishment');
        const btnMP = document.getElementById('btn-mp');

        if(!role || !status || !date) {
            resultArea.innerText = "";
            countDiv.innerText = "0 encontrados";
            updateMedalLink();
            return;
        }

        const filteredNicks = medalData
            .filter(r => r.dataRef === date && r.status.toLowerCase() === status.toLowerCase() && r.cargo.includes(role))
            .map(r => r.nick);

        const uniqueNicks = [...new Set(filteredNicks)];
        resultArea.innerText = uniqueNicks.join(' / ');
        countDiv.innerText = `${uniqueNicks.length} encontrados`;
        
        btnMedal.classList.remove('hidden'); 
        if (status === 'Positivo') {
            btnWarn.classList.add('hidden');
            btnMP.classList.add('hidden');
        } else {
            btnWarn.classList.remove('hidden');
            btnMP.classList.remove('hidden');
        }

        updateMedalLink();
        checkActiveMembers(); 
    }
    
    // Comparador de Ativos
    function checkActiveMembers() {
        const filteredText = document.getElementById('med-result').innerText;
        const activeInputText = document.getElementById('active-list-input').value;
        const resultContainer = document.getElementById('inactive-result-container');
        
        if (!filteredText || !activeInputText.trim()) {
            resultContainer.classList.add('hidden');
            return;
        }

        const filteredList = filteredText.split(' / ').map(n => n.trim()).filter(n => n);
        const activeSet = new Set();
        const lines = activeInputText.split('\n');

        lines.forEach(line => {
            const match = line.trim().match(/^([^\s]+)/); 
            if (match && match[1]) activeSet.add(match[1].trim().toLowerCase());
        });

        const missingNicks = filteredList.filter(nick => !activeSet.has(nick.toLowerCase()));
        const label = document.getElementById('inactive-label');
        const resultText = document.getElementById('inactive-nicks');

        resultContainer.classList.remove('hidden');
        
        if (missingNicks.length > 0) {
            resultContainer.className = "mt-3 p-3 bg-red-50 border border-red-100 rounded-lg transition-all duration-300";
            label.className = "text-[10px] font-bold text-red-400 uppercase tracking-wide block mb-1";
            label.innerText = "Inativos / Saíram (Não encontrados na lista):";
            resultText.className = "text-sm font-bold text-red-700 font-mono";
            resultText.innerText = missingNicks.join(' / ');
        } else {
            resultContainer.className = "mt-3 p-3 bg-green-50 border border-green-100 rounded-lg transition-all duration-300";
            label.className = "text-[10px] font-bold text-green-500 uppercase tracking-wide block mb-1";
            label.innerText = "Status:";
            resultText.className = "text-sm font-bold text-green-700 font-mono";
            resultText.innerHTML = "<i class='fas fa-check-circle mr-1'></i> Todos os filtrados estão ativos!";
        }
    }

    function updateMedalLink() {
        const btn = document.getElementById('btn-medal-link');
        const responsible = document.getElementById('med-responsible').value;
        const result = document.getElementById('med-result').innerText;
        const date = document.getElementById('med-date').value;
        btn.disabled = !(responsible && result && date);
    }

    function getActiveNicksFromFilter() {
        const nicks = document.getElementById('med-result').innerText;
        const activeInputText = document.getElementById('active-list-input').value;
        
        if (!activeInputText || activeInputText.trim() === "") {
            showToast("A listagem de gratificações está vazia!<br>Portanto, cole a listagem para validar e prosseguir.", "warning", "Ação Bloqueada");
            return null; 
        }

        const currentList = nicks.split(' / ').map(n => n.trim()).filter(n => n);
        const activeSet = new Set();
        
        const lines = activeInputText.split('\n');
        lines.forEach(line => {
            const match = line.trim().match(/^([^\s]+)/); 
            if (match && match[1]) activeSet.add(match[1].trim().toLowerCase());
        });

        const activeOnly = currentList.filter(nick => activeSet.has(nick.toLowerCase()));
        
        if (activeOnly.length === 0) {
             showToast("Nenhum membro ativo encontrado na seleção atual.", "error");
             return [];
        }
        
        return activeOnly;
    }

    function openMedalLink() {
        const activeNicks = getActiveNicksFromFilter();
        if (activeNicks === null) return;
        if (activeNicks.length === 0) return; 

        const responsible = document.getElementById('med-responsible').value;
        const role = document.getElementById('med-role').value;
        const status = document.getElementById('med-status').value;
        const date = document.getElementById('med-date').value;
        
        const nicksStr = activeNicks.join(' / ');
        const encResp = encodeURIComponent(responsible);
        const encNicks = encodeURIComponent(nicksStr); 
        const encDate = encodeURIComponent(date);
        const encRole = encodeURIComponent(role + "(a)"); 

        let basePoints = 10;
        if (role === 'Mentor' || role === 'Capacitador') basePoints = 15;
        else if (role === 'Graduador') basePoints = 25;

        let finalPoints = (status === 'Positivo') ? basePoints : (basePoints * -1);
        let motivo = (status === 'Positivo') ? "Cumprimento%20de%20meta%20do%20cargo%20de" : "N%C3%A3o%20cumprimento%20de%20meta%20do%20cargo%20de";
        
        window.open(`https://www.policiarcc.com/h17-postagem-de-medalhas-af?responsavel_med=${encResp}&grupo_tarefas=Escola%20de%20Forma%C3%A7%C3%A3o%20de%20Executivos&periodo_med=${encDate}&gratificados_med=${encNicks}&numero_med=${finalPoints}&cargo_med=${encRole}&motivo_grat=${motivo}`, '_blank');
    }

    // Botão Postar Punição
    async function sendPunishments() {
        const responsible = document.getElementById('med-responsible').value;
        const role = document.getElementById('med-role').value;
        const status = document.getElementById('med-status').value;

        if(!responsible) { showToast("Preencha o campo de Responsável.", "warning"); return; }
        if(status !== 'Negativo') { showToast("Punições apenas para Negativos.", "warning"); return; }
        
        const activeNicks = getActiveNicksFromFilter();
        if (activeNicks === null) return;
        if (activeNicks.length === 0) return;

        const btn = document.getElementById('btn-punishment');
        btn.disabled = true; btn.innerText = "Enviando...";

        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 30);
        
        const dateTimeStr = new Date().toLocaleString('pt-BR');
        const endDateStr = endDate.toLocaleDateString('pt-BR');
        const motivo = `Não cumprimento das funções como ${role}(a)`;
        const tipo = "Advertência Interna";

        const rowsToSend = activeNicks.map(nick => [dateTimeStr, nick, tipo, motivo, endDateStr]);

        try {
            await fetch(LOG_SCRIPT_URL, {
                method: 'POST', mode: 'no-cors', 
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ sheet: "Advertência", rows: rowsToSend })
            });
            showToast("Punições enviadas com sucesso!", "success");
        } catch (error) {
            console.error(error); showToast("Erro ao enviar punições.", "error");
        } finally {
            btn.disabled = false; btn.innerHTML = '<i class="fas fa-gavel"></i> <span>Postar Punição</span>';
        }
    }

    async function openPMLink() {
        const role = document.getElementById('med-role').value;
        const status = document.getElementById('med-status').value;
        const activeNicks = getActiveNicksFromFilter();
        if (activeNicks === null) return;
        if (activeNicks.length === 0) return;
        
        const btn = document.getElementById('btn-mp');
        const originalText = btn.innerHTML;
        const DELAY_MS = 6000; 

        const confirmed = await showCustomConfirm(
            "Confirmação de Envio de MP", 
            `Você está prestes a enviar MP para <b>${activeNicks.length}</b> usuários ativos.<br><br>`
        );

        if (!confirmed) return;

        btn.disabled = true;
        
        for(let i=0; i < activeNicks.length; i++) {
            const nick = activeNicks[i];
            btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Enviando (${i+1}/${activeNicks.length})`;
            
            const template = await getOceanMPTemplate(status, role, nick);
            if(!template) { console.warn("Template inválido para", nick); continue; }

            const result = await sendPrivateMessage(nick, template.subject, template.message);

            if(result === 'OK') {
                console.log(`MP enviada para ${nick}`);
            } else if (result === 'FLOOD') {
                showToast(`Flood Control detectado para ${nick}. Pausando.`, "error");
                break;
            } else if (result === 'USER_NOT_FOUND') {
                console.warn(`Usuário não encontrado: ${nick}`);
            } else {
                console.error(`Erro ao enviar para ${nick}`);
            }

            if(i < activeNicks.length - 1) {
                await delay(DELAY_MS);
            }
        }

        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-check"></i> Concluído`;
        setTimeout(() => { btn.innerHTML = originalText; }, 3000);
        showToast("Processo de envio de MPs finalizado.", "success");
    }

    // --- CÓDIGO DA TABELA (METAS) ---
    const MASTER_BASE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAm7FkCrMwblbAPjFnuxoxeZNHdAc18M7bm-qR3k2YqB_i047AJ0LduIJjJ9iP7ZqT7dGpzFWtY2mp/pub";
    const TARGET_SHEET_NAME = "[EFE] Contador";
    const LOG_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyPdKr_TJ6IMcLUFAavHVFaSg6e2vhjsALDFtQo2zMkmU5aQ3_KCUQGUex5fgYLoWnnuw/exec";
    
    // Configurações da Planilha de Membros (Listagem)
    const MEMBERS_SHEET_ID = "1Y09nybDM7GdOMpO03QZyoh0UP1-Or0CYyV_shKh84Oc";
    const MEMBERS_GID = "1532718941";
    let membersCache = {};

    const CACHE_DURATION_MS = 1000 * 60 * 5; 

    const RANK_CONFIG = {
        'Professor': { gid: '0', topicId: '38482', nickCol: 19, classCols: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30], headerLabels: ['APB', 'API', 'APA', 'AFP', 'AFO', 'CICE', 'Av.CE', 'AFCE', 'ASC', 'DOA', 'ACOM'], weights: [25, 20, 20, 15, 15, 15, 25, 15, 20, 0, 10], statusCol: 33, checkCol: 31, period: 'SEMANAL', superiorKeywords: ["mentor", "capacitador", "graduador", "estagiário", "ministro", "vice-líder", "líder"] },
        'Mentor': { gid: '972474941', topicId: '38483', nickCol: 17, classCols: [18, 19, 20, 21], headerLabels: ['AS', 'ACOM', 'SUPL', 'IAL'], weights: [50, 75, 50, 25], statusCol: 24, checkCol: 22, period: 'SEMANAL', superiorKeywords: ["capacitador", "graduador", "estagiário", "ministro", "vice-líder", "líder"] },
        'Capacitador': { gid: '1681958430', topicId: '38625', nickCol: 17, classCols: [18 ,19, 20, 21, 22, 23], headerLabels: ['CTP', 'CPP', 'CPM', 'CED', 'AEB', 'TCE'], weights: [50, 50, 50, 50, 50, 50], statusCol: 26, checkCol: 24, period: 'SEMANAL', superiorKeywords: ["graduador", "estagiário", "ministro", "vice-líder", "líder"] },
        'Graduador': { gid: '1707625426', topicId: '38484', nickCol: 17, classCols: [18, 19, 20],  headerLabels: ['Básica', 'Inter.', 'Avançada'], weights: [1, 1, 1], statusCol: 23, checkCol: 21, period: 'QUINZENAL', superiorKeywords: ["Estagiário(a)", "ministro(a)", "vice-líder", "líder"] }
    };

    let currentRankKey = '';
    let masterData = []; 
    let currentRenderData = []; 
    let currentSheetTitle = '';
    let forumTokens = null; 
    
    // Objeto temporário para guardar os dados da postagem enquanto o modal está aberto
    let pendingPostData = {
        cargo: '',
        title: '',
        groupedStatuses: {} // Changed from strPositivos/Negativos to object map
    };
    
    const statusMap = { "[A]": { text: "Positivo", code: "A" }, "[B]": { text: "Negativo", code: "B" }, "[IS]": { text: "Isenção", code: "IS" }, "[DO]": { text: "Doação", code: "DO" }, "[J]": { text: "Justificada", code: "J" }, "[GP]": { text: "Grad. Pend.", code: "GP" }, "[RL]": { text: "Retorno", code: "RL" }, "[L]":  { text: "Licença", code: "L" }, "[CE]": { text: "Caso Esp.", code: "CE" }, "[Z]":  { text: "Caso Esp.", code: "CE" }, "[ER]": { text: "Entrada Recente", code: "ER" } };
    
    // Mapping for Spreadsheet Column (Situacao)
    const SHEET_STATUS_MAP = {
        'A': 'Positivo', 'PRO': 'Positivo', 'POSITIVO': 'Positivo',
        'B': 'Negativo', 'NEGATIVO': 'Negativo',
        'IS': 'Isento',
        'J': 'Justificado',
        'L': 'Licença',
        'RL': 'Retorno',
        'GP': 'Graduação Pendente',
        'CE': 'Caso Especial',
        'DO': 'Doação',
        'ER': 'Entrada Recente'
    };

    const els = {
        navBtns: document.querySelectorAll('.rank-pill'), 
        filtersPanel: document.getElementById('filters-panel'),
        yearSelect: document.getElementById('select-year'),
        monthSelect: document.getElementById('select-month'),
        titleSelect: document.getElementById('select-title'),
        tableHead: document.getElementById('table-head'),
        tableBody: document.getElementById('table-body'),
        emptyMsg: document.getElementById('empty-message'),
        toolbar: document.getElementById('table-toolbar'),
        btnPost: document.getElementById('btn-post'),
        textPost: document.getElementById('text-post')
    };

    async function fetchMembersData() {
        if(Object.keys(membersCache).length > 0 && !forceBypassCache) return;
        
        try {
            const url = `https://docs.google.com/spreadsheets/d/${MEMBERS_SHEET_ID}/export?gid=${MEMBERS_GID}&format=tsv`;
            const tsvText = await fetchSmart(url, false); // false = não é GViz JSON, é raw TSV
            
            const today = new Date();
            today.setHours(12, 0, 0, 0); 
            
            const rows = tsvText.split('\n').map(r => r.split('\t'));

            rows.forEach(row => {
                if(row.length < 4) return;
                const cargo = cleanCell(row[0]);
                const originalNick = cleanCell(row[1]); 
                const nick = originalNick.toLowerCase(); 
                const dataRaw = cleanCell(row[3]);
                
                if(!nick || !cargo) return;

                let promoDate = null;
                if(dataRaw) {
                    if(dataRaw.includes('/')) {
                        const parts = dataRaw.split('/');
                        if(parts.length === 3) promoDate = new Date(parts[2], parts[1]-1, parts[0]);
                    } else if (dataRaw.includes('-')) {
                        const parts = dataRaw.split('-');
                        if(parts.length === 3) promoDate = new Date(parts[0], parts[1]-1, parts[2]);
                    }
                }

                let diffDays = 999;
                if(promoDate && !isNaN(promoDate)) {
                    promoDate.setHours(12, 0, 0, 0); 
                    const diffTime = Math.abs(today - promoDate);
                    diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                }

                membersCache[nick] = {
                    cargo: cargo,
                    diffDays: diffDays,
                    rawDate: dataRaw,
                    displayNick: originalNick 
                };
            });
        } catch (e) {
            console.error("Erro ao carregar lista de membros:", e);
        }
    }

    function renderSkeleton(colsCount = 5, rowsCount = 8) {
        let html = '';
        for(let i=0; i<rowsCount; i++) {
            let cells = '';
            for(let j=0; j<colsCount; j++) cells += `<td><div class="skeleton-box sk-cell" style="height:20px"></div></td>`;
            html += `<tr><td class="col-avatar"><div class="skeleton-box sk-avatar"></div></td><td class="col-nick"><div class="skeleton-box sk-text"></div></td>${cells}<td class="col-total"><div class="skeleton-box sk-cell" style="width:30px; height:20px"></div></td><td><div class="skeleton-box sk-badge" style="height:24px"></div></td><td><div class="skeleton-box sk-badge" style="width: 80px; height:30px"></div></td></tr>`;
        }
        els.tableBody.innerHTML = html;
        els.emptyMsg.classList.add('hidden');
    }

    async function init() { 
        await selectRank('Professor'); 
    }

    function parseMasterData(tsvText) {
        const rows = tsvText.split('\n').map(r => r.split('\t'));
        masterData = [];
        for (let i = 0; i < rows.length; i++) {
            const col = rows[i];
            if (col.length < 4) continue;
            const year = col[0] ? col[0].trim() : "";
            const month = col[1] ? col[1].trim() : "";
            const title = col[2] ? col[2].trim() : "";
            const link = col[3] ? col[3].trim() : "";
            if (!year || year.toLowerCase().includes('ano')) continue; 
            masterData.push({ year, month, title, link });
        }
    }

    async function fetchTopicTokens(topicId) {
        forumTokens = null; 
        try {
            const replyUrl = `/post?mode=reply&t=${topicId}`;
            const resp = await fetch(replyUrl);
            if(!resp.ok) throw new Error("Falha rede");
            const text = await resp.text();
            const dom = new DOMParser().parseFromString(text, 'text/html');
            let form = dom.querySelector('form[action*="/post"]');
            if(!form) form = dom.querySelector('form#postform');
            if(form) {
                const inputs = [];
                form.querySelectorAll('input[type="hidden"]').forEach(inp => inputs.push({ name: inp.name, value: inp.value }));
                if(!inputs.find(i=>i.name==='post')) inputs.push({name:'post', value:'1'});
                if(!inputs.find(i=>i.name==='mode')) inputs.push({name:'mode', value:'reply'});
                if(!inputs.find(i=>i.name==='t')) inputs.push({name:'t', value:topicId});
                let action = form.getAttribute('action');
                if(!action.startsWith('http')) action = window.location.origin + (action.startsWith('/') ? '' : '/') + action;
                forumTokens = { action, inputs };
            }
        } catch(e) { console.warn("Erro ao pre-carregar tokens: ", e); }
    }

    window.selectRank = async function(rankName) {
        currentRankKey = rankName;
        document.querySelectorAll('.rank-pill').forEach(btn => {
            if(btn.getAttribute('data-title').includes(rankName)) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        // Visibilidade do botão de Destaque
        const btnDestaque = document.getElementById('btn-destaque');
        if(rankName === 'Professor') btnDestaque.classList.remove('hidden');
        else btnDestaque.classList.add('hidden');

        els.tableBody.innerHTML = '';
        els.emptyMsg.classList.remove('hidden');
        els.toolbar.classList.add('hidden');
        
        els.yearSelect.innerHTML = '<option value="">Carregando...</option>'; els.yearSelect.disabled = true;
        els.monthSelect.innerHTML = '<option value="">Aguarde...</option>'; els.monthSelect.disabled = true;
        els.titleSelect.innerHTML = '<option value="">Aguarde...</option>'; els.titleSelect.disabled = true;
        
        els.tableHead.innerHTML = ''; 
        
        try {
            const config = RANK_CONFIG[rankName];
            fetchTopicTokens(config.topicId);
            const masterUrl = `${MASTER_BASE_URL}?gid=${config.gid}&output=tsv`;
            const text = await fetchSmart(masterUrl);
            parseMasterData(text);
            populateYears();
        } catch (error) { console.error(error); }
    }

    function populateYears() {
        const uniqueYears = [...new Set(masterData.map(d => d.year))].sort().reverse();
        els.yearSelect.innerHTML = '<option value="">Selecione...</option>';
        uniqueYears.forEach(y => els.yearSelect.innerHTML += `<option value="${y}">${y}</option>`);
        els.yearSelect.disabled = false;
        els.monthSelect.innerHTML = '<option value="">Selecione...</option>'; els.monthSelect.disabled = true;
        els.titleSelect.innerHTML = '<option value="">Selecione...</option>'; els.titleSelect.disabled = true;
    }

    els.yearSelect.addEventListener('change', () => {
        const selectedYear = els.yearSelect.value;
        if (!selectedYear) return;
        const filteredMonths = [...new Set(masterData.filter(d => d.year === selectedYear).map(d => d.month))];
        els.monthSelect.innerHTML = '<option value="">Selecione...</option>';
        filteredMonths.forEach(m => els.monthSelect.innerHTML += `<option value="${m}">${m}</option>`);
        els.monthSelect.disabled = false;
        els.titleSelect.innerHTML = '<option value="">Selecione...</option>'; els.titleSelect.disabled = true;
    });

    els.monthSelect.addEventListener('change', () => {
        const year = els.yearSelect.value;
        const month = els.monthSelect.value;
        const filteredTitles = masterData.filter(d => d.year === year && d.month === month);
        els.titleSelect.innerHTML = '<option value="">Selecione...</option>';
        filteredTitles.forEach(t => els.titleSelect.innerHTML += `<option value="${t.link}">${t.title}</option>`);
        els.titleSelect.disabled = false;
    });

    els.titleSelect.addEventListener('change', async () => {
        if(els.titleSelect.value) {
            currentSheetTitle = els.titleSelect.options[els.titleSelect.selectedIndex].text;
            await fetchAndRenderTarget(els.titleSelect.value);
        }
    });

    function cleanCell(c) { return c ? c.replace(/^"|"$/g, '').trim() : ""; }

    async function fetchAndRenderTarget(originalUrl) {
        const config = RANK_CONFIG[currentRankKey];
        renderHeader(config);
        renderSkeleton(config.headerLabels.length, 8); 
        els.toolbar.classList.add('hidden');
        currentRenderData = [];
        
        try {
            await fetchMembersData();

            const idMatch = originalUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (!idMatch) throw new Error("ID inválido.");
            const gvizUrl = `https://docs.google.com/spreadsheets/d/${idMatch[1]}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(TARGET_SHEET_NAME)}`;
            const csvText = await fetchSmart(gvizUrl, true);
            const rows = parseCSV(csvText);
            const processedRows = [];
            
            for(let i = 0; i < rows.length; i++) {
                const cols = rows[i];
                if (cols.length < config.nickCol + 1) continue;
                const nick = cleanCell(cols[config.nickCol]);
                if (!nick || nick.length < 3 || nick.toLowerCase().includes('nickname') || nick.toUpperCase() === 'PROFESSOR') continue;
                
                let isSuperior = false;
                let promotionStatus = "";
                let promotionLabel = ""; 
                
                const memberInfo = membersCache[nick.toLowerCase()];
                
                if (memberInfo) {
                    const cargoLower = memberInfo.cargo.toLowerCase();
                    const daysDiff = memberInfo.diffDays;
                    let isHigherRank = false;

                    if(currentRankKey === 'Professor' && !cargoLower.includes('professor')) isHigherRank = true;
                    else if(currentRankKey === 'Mentor' && !cargoLower.includes('mentor') && !cargoLower.includes('professor')) isHigherRank = true;

                    if (isHigherRank) {
                        isSuperior = true;
                        let limitDays = 7;
                        if(currentRankKey === 'Graduador' && cargoLower.includes('estagiário')) limitDays = 16;

                        if(daysDiff <= limitDays) {
                            promotionStatus = "Recém-Promovido(a)";
                            promotionLabel = "Recém-Promovido(a)";
                        } else {
                            promotionStatus = memberInfo.cargo; 
                            promotionLabel = memberInfo.rawDate; 
                        }
                    }
                }

                if (!isSuperior) {
                    const rawCheck = cleanCell(cols[config.checkCol]).toLowerCase();
                    const rawNick = nick.toLowerCase();
                    if (config.superiorKeywords.some(k => rawCheck.includes(k) || rawNick.includes(k))) {
                        isSuperior = true;
                        promotionStatus = "Promovido(a)";
                        promotionLabel = "Cargo Superior";
                    }
                }

                let totalPoints = 0;
                let classValues = [];
                let doaCount = 0;
                let classesSum = 0;

                config.classCols.forEach((idx, arrIdx) => {
                    const rawVal = cleanCell(cols[idx]).replace(',', '.');
                    const val = parseInt(rawVal) || 0;
                    const weight = config.weights ? config.weights[arrIdx] : 1;
                    totalPoints += (val * weight);
                    classValues.push(val);
                    
                    const label = config.headerLabels[arrIdx];
                    if(label === 'DOA') doaCount = val;
                    else classesSum += val; 
                });
                
                const rawStatus = cleanCell(cols[config.statusCol]);
                let statusObj = statusMap[rawStatus] || { text: (rawStatus === 'N/A' || !rawStatus) ? "Indefinido" : rawStatus, code: "DEFAULT" };

                const hasDonation = (currentRankKey === 'Professor' && doaCount > 0);
                let justification = "";

                // --- LÓGICA DE METAS CORRIGIDA (REGRA < 2) ---
                if (currentRankKey === 'Professor') {
                    // Contagem total de ações (Aulas + Doações se houver)
                    const totalApplied = classesSum + doaCount;
                    
                    // STATUS DE ISENÇÃO (Prioridade sobre matemática)
                    const isExempt = ['[L]', '[RL]', '[IS]', '[ER]', '[CE]', '[GP]'].includes(rawStatus);

                    if (isSuperior) {
                        if (promotionStatus === "Recém-Promovido(a)") {
                             statusObj = { text: promotionStatus, code: "PRO" };
                        } else if (totalApplied >= 2) {
                             statusObj = { text: promotionStatus, code: "PRO" };
                        } else {
                             // Superior que não fez a meta vira CE (conforme lógica padrão)
                             statusObj = { text: "Caso Esp.", code: "CE" };
                             justification = promotionStatus; 
                        }
                    } else {
                        // Se não é superior e não tem isenção prévia na planilha
                        if (!isExempt) {
                            if (totalApplied >= 2) {
                                statusObj = { text: "Positivo", code: "A" };
                            } else {
                                // Menos de 2 aulas = NEGATIVO [B]
                                statusObj = { text: "Negativo", code: "B" }; 
                            }
                        }
                    }
                } else {
                    if (isSuperior) statusObj = { text: promotionStatus, code: "PRO" };
                }
                
                const avatarUrl = `https://www.habbo.com.br/habbo-imaging/avatarimage?user=${nick}&headonly=1&size=m`;
                processedRows.push({ nick, classValues, total: totalPoints, statusObj, rawStatus, avatarUrl, isSuperior, justification, hasDonation, promotionLabel });
            }
            
            processedRows.sort((a, b) => b.total - a.total);
            currentRenderData = processedRows;
            renderTable(processedRows);
        } catch (error) {
            console.error(error);
            els.tableBody.innerHTML = '<tr><td colspan="15" class="text-center p-8 text-red-400 font-bold">Erro ao ler dados.</td></tr>';
        }
    }

    function renderTable(rows) {
        let html = '';
        const statusOptions = [
            {val: '[A]', label: 'Positivo'}, {val: '[B]', label: 'Negativo'},
            {val: '[L]', label: 'Licença'}, {val: '[RL]', label: 'Retorno Licença'},
            {val: '[GP]', label: 'Graduação Pendente'}, {val: '[IS]', label: 'Isenção'},
            {val: '[ER]', label: 'Entrada Recente'}, {val: '[CE]', label: 'Caso Especial'},
            {val: '[DO]', label: 'Doação'}, {val: '[J]', label: 'Justificada'}
        ];
        
        const isTurbo = document.body.classList.contains('turbo-mode');

        rows.forEach((row, index) => {
            const classCells = row.classValues.map(v => `<td class="col-stat">${v > 0 ? v : '-'}</td>`).join('');
            const optionsHtml = statusOptions.map(opt => `<option value="${opt.val}" ${row.rawStatus === opt.val ? 'selected' : ''}>${opt.label}</option>`).join('');
            const rowClass = row.isSuperior ? 'row-superior' : '';
            
            // LÓGICA DO LABEL ABAIXO DO SELECT 
            const superiorLabel = row.isSuperior 
                ? `<span class="text-[9px] text-[#2c5282] font-extrabold uppercase tracking-wider block mt-1 ml-1 opacity-80">${row.promotionLabel || row.statusObj.text}</span>` 
                : '';
            
            // Se for Caso Especial (CE), mostra o input de justificativa já preenchido se houver valor
            const isCE = (row.statusObj.code === 'CE' || row.rawStatus === '[CE]');
            const justificationStyle = isCE ? 'visible' : '';
            const justifyValue = row.justification || '';
            
            const animDelay = isTurbo ? 0 : Math.min(index * 0.03, 1.0);
            
            html += `<tr class="${rowClass} animate-row" style="animation-delay: ${animDelay}s">
                    <td class="col-avatar"><img src="${row.avatarUrl}" loading="lazy" onerror="this.style.display='none';" alt="${row.nick}"></td>
                    <td class="col-nick">${row.nick}</td>${classCells}<td class="col-total"><span class="total-badge">${row.total}</span></td>
                    <td class="text-center"><span class="status-badge" data-code="${row.statusObj.code}">${row.statusObj.text}</span></td>
                    <td class="text-center"><div class="flex flex-col items-center justify-center p-2"><div class="table-select-wrapper w-full">
                                <select class="table-select" onchange="updateRowStatus(${index}, this.value)">
                                    <option value="${row.rawStatus}">${row.isSuperior ? (row.statusObj.code === 'A' || row.statusObj.code === 'PRO' ? 'Positivo' : 'Cargo Superior') : (row.statusObj.text !== 'Indef.' ? row.statusObj.text : 'Selecione')}</option>
                                    ${optionsHtml}
                                </select></div><input type="text" id="justify-${index}" class="input-justification ${justificationStyle}" value="${justifyValue}" placeholder="Justifique..." oninput="updateRowJustification(${index}, this.value)">${superiorLabel}</div></td></tr>`;
        });
        els.tableBody.innerHTML = html || '<tr><td colspan="15" class="text-center p-8 text-slate-400">Nenhum dado encontrado.</td></tr>';
        if (html) els.toolbar.classList.remove('hidden');
    }

    window.updateRowStatus = function(index, newVal) {
        if(currentRenderData[index]) {
            currentRenderData[index].userOverrideStatus = newVal;
            const inputEl = document.getElementById(`justify-${index}`);
            if(inputEl) {
                if(newVal === '[CE]') { inputEl.classList.add('visible'); inputEl.focus(); } 
                else { inputEl.classList.remove('visible'); currentRenderData[index].justification = ''; }
            }
        }
    }
    window.updateRowJustification = function(index, text) { if(currentRenderData[index]) currentRenderData[index].justification = text; }

    function renderHeader(config) {
        let headerHtml = `<tr><th class="pl-6 text-left rounded-tl-2xl">Avatar</th><th style="text-align: left; padding-left: 0.5rem;">Nickname</th>`;
        config.headerLabels.forEach(label => { headerHtml += `<th class="text-center">${label}</th>`; });
        headerHtml += `<th class="text-center text-[#2c5282]">Total</th><th>Situação</th><th style="width: 160px;" class="rounded-tr-2xl">Ação / Modif.</th></tr>`;
        els.tableHead.innerHTML = headerHtml;
    }
    function parseCSV(t) { return t.split('\n').map(l => l.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)).filter(r => r.length > 1); }

    // --- LOGICA DE POSTAGEM E COPIA (METAS) ---

    // Função BBCode Corrigida: Respeita 100% a seleção manual (Dropdown)
    function generateBBCodeString(mode = "post") {
        if(!currentRenderData.length) return "";
        const config = RANK_CONFIG[currentRankKey];
        const titleMeta = currentSheetTitle || "TÍTULO";
        const periodText = config.period === 'QUINZENAL' ? 'META QUINZENAL' : 'META SEMANAL';
        const rankUpper = currentRankKey.toUpperCase();
        
        // --- LOGICA DE DESTAQUE NOVA (Usando Template fornecido) ---
        if (mode === 'highlight') {
            // Pega o 1º e 2º lugar da tabela já ordenada
            const d1 = currentRenderData[0];
            const d2 = currentRenderData[1];
            
            // Define valores default caso não haja dados suficientes
            const nick1 = d1 ? d1.nick : "---";
            const nick2 = d2 ? d2.nick : "---";
            const refDate = currentSheetTitle || "DATA INDEFINIDA";

            return `[center][img(70px,70px)]https://i.imgur.com/U9aXSQB.png[/img][/center]

[table style="width: 30%; border: none!important; overflow: hidden; border-radius: 7px; position: relative; margin: auto; bottom: 3.2em; font-family: 'Poppins', sans-serif; color: #ffffff; box-shadow: 0 4px 12px rgba(93, 142, 163, 0.4); z-index: 2" bgcolor="79a8c3"][tr style="border: none !important;"][td style="border: none!important; padding: 8px"][b]Escola de Formação de Executivos[/b][/td][/tr][/table]

[table style="width: 23%; border: none!important; overflow: hidden; border-radius: 0 0 5px 5px; position: relative; margin: auto; bottom: 4.6em; font-family: 'Poppins', sans-serif; color: #ffffff; box-shadow: 0 4px 12px rgba(93, 142, 163, 0.4); z-index: 2" bgcolor="5A7D91"][tr style="border: none !important;"][td style="border: none!important; padding: 4px"][size=11]${refDate}[/size][/td][/tr][/table]

[table style="width: 50%; border: none!important; overflow: hidden; left: 8.3em; bottom: 6em; position: relative; z-index: 2"][tr style="border: none !important;"][td style="border: none!important; padding: 4px"][img]https://www.habbo.com.br/habbo-imaging/avatarimage?&user=${nick1}&action=std&direction=5&head_direction=2&img_format=png&gesture=std&headonly=1&size=b[/img][/td][/tr][/table]

[table style="width: 30%; border: none!important; overflow: hidden; border-radius: 5px 5px 5px 5px; position: relative; margin-top: -11em; margin-left: 26em; font-family: 'Poppins', sans-serif; color: #ffffff; z-index: 1"][tr style="border: none!important;"][td style="width: 15%; border: none!important; padding: 4px" bgcolor="5A7D91"][right]1º[/right][/td][td style="width: auto; border: none!important; padding: 4px" bgcolor="e0e0e0"][b][color=#4d7684]${nick1}[/color][/b][/td][/tr][/table]

[table style="width: 50%; border: none!important; overflow: hidden; left: 29em; bottom: 3em; position: relative; z-index: 2"][tr style="border: none !important;"][td style="border: none!important; padding: 4px"][img]https://www.habbo.com.br/habbo-imaging/avatarimage?&user=${nick2}&action=std&direction=5&head_direction=4&img_format=png&gesture=std&headonly=1&size=b[/img][/td][/tr][/table]

[table style="width: 30%; border: none!important; overflow: hidden; border-radius: 5px 5px 5px 5px; position: relative; margin-top: -8em; margin-left: 26em; font-family: 'Poppins', sans-serif; color: #ffffff; z-index: 1"][tr style="border: none!important;"][td style="width: auto; border: none!important; padding: 4px" bgcolor="e0e0e0"][b][color=#4d7684]${nick2}[/color][/b][/td][td style="width: 15%; border: none!important; padding: 4px"  bgcolor="5A7D91"][left]2º[/left][/td][/tr][/table]
`;
        }
        
        // --- LOGICA PADRÃO (POSTAGEM DE METAS) ---
        const destaques = []; const positivos = []; const negativos = []; const outros = [];
        
        // LISTAS DE CLASSIFICAÇÃO RÍGIDAS
        const LISTA_POSITIVOS = ['[A]', '[PRO]', 'A', 'PRO', 'POSITIVO', 'RECÉM-PROMOVIDO(A)', 'PROMOVIDO(A)'];
        // Apenas [B] ou Negativo explícito vai para o bloco de negativos no BBCode
        const LISTA_NEGATIVOS = ['[B]', 'B', 'NEGATIVO']; 

        // --- DICIONÁRIO DE TRADUÇÃO DE STATUS (CORREÇÃO DE TEXTO) ---
        const STATUS_TRANSLATIONS = {
            'L': 'Licença', '[L]': 'Licença',
            'RL': 'Retorno de Licença', '[RL]': 'Retorno de Licença',
            'GP': 'Graduação Pendente', '[GP]': 'Graduação Pendente',
            'IS': 'Isenção', '[IS]': 'Isenção',
            'ER': 'Entrada Recente', '[ER]': 'Entrada Recente',
            'DO': 'Doação', '[DO]': 'Doação',
            'J': 'Justificada', '[J]': 'Justificada',
            'CE': 'Caso Especial', '[CE]': 'Caso Especial',
            'Z': 'Caso Especial', '[Z]': 'Caso Especial',
            'Caso Esp.': 'Caso Especial',
            'Indefinido': 'Indefinido'
        };

        currentRenderData.forEach((row, index) => {
            // LÓGICA DE PRIORIDADE:
            // 1. Se o usuário mexeu no dropdown (userOverrideStatus), ISSO É LEI.
            // 2. Se não mexeu, usa o cálculo automático (statusObj.code).
            
            let finalCode = "";
            
            if (row.userOverrideStatus && row.userOverrideStatus !== 'Selecione') {
                finalCode = row.userOverrideStatus; // Ex: [J], [B], [A], [DO]
            } else {
                finalCode = row.statusObj.code; // Ex: A, B, PRO
                // Normaliza para formato com colchetes se vier limpo (apenas para classificação)
                if(finalCode === 'A') finalCode = '[A]';
                if(finalCode === 'B') finalCode = '[B]';
                if(finalCode === 'PRO') finalCode = '[PRO]';
            }

            // Normalização de texto para comparação (Upper Case e sem espaços extras)
            let checkCode = String(finalCode).trim().toUpperCase();

            // Lógica de Destaque para POST NORMAL (Apenas visual para o topo)
            const isHighlight = (index === 0 || index === 1) && (LISTA_POSITIVOS.includes(checkCode) || checkCode.includes('PRO'));

            if (isHighlight) {
                destaques.push(row);
            } 
            else if (LISTA_POSITIVOS.includes(checkCode)) {
                positivos.push(row);
            } 
            else if (LISTA_NEGATIVOS.includes(checkCode)) {
                // Só entra aqui se for estritamente [B] ou Negativo
                negativos.push(row);
            } 
            else {
                // "Cesto de Lixo" para Casos Especiais:
                // Aqui caem: [J], [L], [IS], [DO], [GP], [CE], [RL], [ER]...
                // E também qualquer coisa que o usuário selecionou que não seja A ou B.
                outros.push(row);
            }
        });

        const getClassesString = (row) => {
            let strParts = [];
            row.classValues.forEach((val, idx) => {
                if(val > 0) {
                    let labelText = config.headerLabels[idx];
                    if(currentRankKey === 'Graduador') {
                        if(labelText.includes('Básica')) labelText = 'GRAD BÁSICA';
                        else if(labelText.includes('Inter')) labelText = 'GRAD INTER';
                        else if(labelText.includes('Avançada')) labelText = 'GRAD AVANÇADA';
                    }
                    strParts.push(`${val} ${labelText}`);
                }
            });
            return strParts.join('    ');
        };

        // --- FUNÇÃO CORRIGIDA PARA EXIBIR TEXTO COMPLETO ---
        const getEndStatusBlock = (status, justification) => {
            let color = "7F8F96"; 
            let textColor = "white";
            
            // 1. Tenta traduzir o código (ex: '[ER]' -> 'Entrada Recente')
            // Se não achar no dicionário, usa o próprio texto (caso seja um override manual sem código)
            let text = STATUS_TRANSLATIONS[status] || status; 

            // 2. Tratamento especial para Caso Especial com Justificativa
            // Verifica se é CE pelo código ou pelo texto traduzido
            if(status.includes('CE') || text === 'Caso Especial') {
                text = justification ? `Caso Especial (${justification})` : "Caso Especial";
            }
            
            // Remove colchetes se sobrou algum (fallback visual)
            text = text.replace(/[\[\]]/g, '');

            return `[td style="border: none!important; overflow: hidden; padding: 5px" bgcolor="${color}"][color=${textColor}][b]${text}[/b][/color][/td][/tr][/table]`;
        };

        const generateDestaqueRow = (row) => {
            const classesStr = getClassesString(row);
            const labelTotal = currentRankKey === 'Graduador' ? (row.total === 1 ? 'Graduação' : 'Graduações') : 'Pontos';
            const classesBlock = classesStr ? `[tr style="border: none!important"][td style="border: none!important;padding: 5px"][table style="width: auto; border-radius: 5px; border: none!important; overflow: hidden; line-height: 1em"][tr style="border: none!important; overflow: hidden"][td style="border: none!important; overflow: hidden; padding: 7px" bgcolor="79a8c3"][color=white][b]${classesStr}[/b][/color][/td][/tr][/table][/td][/tr]` : '';
            return `[table style="width: auto; border-radius: 10px 10px 0px 0px;border: none!important; overflow: hidden; margin: 0; position: relative; top: 1%; left: 15px;justify-content: center"][tr style="border: none!important; overflow: hidden" bgcolor="57788C"][td style="border:none!important; overflow: hidden; padding: 6px"][color=white][size=13][b]${row.nick}[/b][/size][/color][/td][/tr][/table][table style="box-shadow: 0 1px 2px rgba(0, 0, 0, 0.10);width: auto; border-radius: 15px; border: none!important; overflow: hidden; line-height: 1em" bgcolor="E4E4EB"][tr style="border: none!important; overflow: hidden"][td style="border: none!important; overflow: hidden" bgcolor="79a8c3"][img]https://www.habbo.com.br/habbo-imaging/avatarimage?&user=${row.nick}&action=std&direction=5&head_direction=2&img_format=png&gesture=std&headonly=1&size=b[/img][/td][td style="border: none!important; overflow: hidden; padding: 5px" bgcolor="648AA1"][table style="width: auto; border: none!important; overflow: hidden; border-radius: 5px"][tr style="border: none!important"][td style="border: none!important;padding: 5px"][table style="width: auto; border-radius: 5px; border: none!important; overflow: hidden; line-height: 1em" bgcolor="E4E4EB"][tr style="border: none!important; overflow: hidden"][td style="border: none!important; overflow: hidden; padding: 7px" bgcolor="efb810"][b][color=#ffffff]${row.total} ${labelTotal}[/b][/color][/td][/tr][/table][/td][/tr]${classesBlock}[/table][/tr][/td][/table]\n\n`;
        };

        const generateStandardRow = (row, type) => {
            // Pega o status cru (que pode ser [L], L, [GP], GP, etc)
            let status = row.userOverrideStatus || row.statusObj.code;
            
            // Normalização APENAS para os ícones/cores de Positivo/Negativo
            // Não afeta o texto do "Outros" porque passamos o 'status' original para getEndStatusBlock
            let displayStatus = status;
            if(displayStatus === 'A') displayStatus = '[A]';
            if(displayStatus === 'B') displayStatus = '[B]';
            if(displayStatus === 'PRO') displayStatus = row.promotionLabel || 'Promovido(a)';

            const classesStr = getClassesString(row);
            const labelTotal = currentRankKey === 'Graduador' ? (row.total === 1 ? 'Graduação' : 'Graduações') : 'Pontos';
            let dotColor = "#9BAFB8"; let nameBg = "9BAFB8";
            if (type === 'positivo') { dotColor = "green"; nameBg = "93c47d"; } else if (type === 'negativo') { dotColor = "red"; nameBg = "e06666"; }
            
            let html = `[table style="border: none!important; overflow: hidden; border-radius: 5px; width: auto; padding: 0; margin: 5px;"][tr style="border: none!important; overflow: hidden" bgcolor="DCDCE3"][td style="border: none!important; overflow: hidden;padding: 5px"][color=${dotColor}][b]• [/color]${row.nick}[/b][/td][td style="border: none!important; overflow: hidden; padding: 5px" bgcolor="${nameBg}"][color=white][b]${row.total} ${labelTotal}[/b][/color][/td]`;
            if (classesStr) html += `[td style="border: none!important; overflow: hidden; padding: 5px" bgcolor="647882"][color=white][b]${classesStr}[/b][/color][/td]`;
            
            // Verifica Doação Visualmente
            if (row.hasDonation || status === '[DO]' || status === 'DO') {
                 html += `[td style="border: none!important; overflow: hidden; padding: 5px" bgcolor="FFD966"][color=black][b]<i class="fas fa-donate"></i>[/b][/color][/td]`;
            } 

            if (type === 'outros') {
                // AQUI ESTÁ O SEGREDO: Passamos o status original para ser traduzido
                html += getEndStatusBlock(status, row.justification);
            }
            else html += `[/tr][/table]`;
            return html;
        };

        const blockDestaques = destaques.map(generateDestaqueRow).join(' ');
        const blockPositivos = positivos.map(r => generateStandardRow(r, 'positivo')).join(' ');
        const blockNegativos = negativos.map(r => generateStandardRow(r, 'negativo')).join(' ');
        const blockOutros = outros.map(r => generateStandardRow(r, 'outros')).join(' ');

        let footerBlocks = '';
        if(mode !== 'highlight') {
            const footerSums = Array(config.classCols.length).fill(0);
            currentRenderData.forEach(row => { row.classValues.forEach((val, idx) => footerSums[idx] += val); });
            config.headerLabels.forEach((label, idx) => { if(footerSums[idx] > 0) footerBlocks += `[td style="border: none!important; overflow: hidden;padding: 0px"][table style="box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);border: none!important; overflow: hidden; border-radius: 5px; width: auto; padding: 0; margin: 5px;"][tr style="border: none!important; overflow: hidden"][td style="border: none!important; overflow: hidden;padding: 7px" bgcolor="647882"][color=white][b]${label}[/b][/color][/td][td style="border: none!important; overflow: hidden; padding: 7px" bgcolor="79a8c3"][color=white][b]${footerSums[idx]}[/b][/color][/td][/tr][/table][/td]`; });
        }
        
        return `[font=Poppins][table style="border: none!important; overflow: hidden; border-radius: 15px; width: auto; padding: 0; margin: 0 auto; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); text-align: center;" bgcolor="#79a8c3"][tr style="border: none!important; overflow: hidden"][td style="border: none!important; overflow: hidden; padding: 7px"][table style="line-height: 0.2em; width: 100%; border-radius: 15px; border: none!important; overflow: hidden; line-height: 0.5em; margin: 0 auto;" bgcolor="#25313a"][tr style="border: none!important; overflow: hidden"][td style="border: none!important; overflow: hidden; padding: 14px"][img]https://i.imgur.com/S1tKqgc.gif[/img]\n[table style="border: none!important; border-radius: 40px; overflow: hidden; width: 40%; margin: -2% auto; top: 0.8em; position: relative; z-index: 10; justify-content: center;" bgcolor="79a8c3"][tr style="border: none!important;"][td style="border: none!important;"][center][color=white][b][size=16]${periodText} - ${rankUpper}ES[/size][/b][/color][/center][/td][/tr][/table]\n[table style="width: 100%; border-radius: 15px; border: none!important; overflow: hidden; position: relative; z-index: 1; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);line-height: 1.4em; margin: 0 auto;" bgcolor="f8f8ff"][tr style="border: none!important; overflow: hidden"][td style="border: none!important; overflow: hidden"]\n\nSaudações, [color=#79a8c3][b]{USERNAME}[/b][/color]. Verifique abaixo a meta de ${rankUpper.toLowerCase()}es do período de [color=#79a8c3][b]${titleMeta}[/b][/color]:\n[center][table style="width: 20%; border-radius: 10px;border: none!important; overflow: hidden; line-height: 1em; margin-top:1em" bgcolor="79a8c3"][tr style="border: none!important; overflow: hidden"][td style="border: none!important; overflow: hidden; padding: 1px"][/td][/tr][/table][/center]\n\n[table style="border: none!important; border-radius: 40px; overflow: hidden; width: 40%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); margin: -2% auto; top: 1.2em; right: 45%; position: relative; z-index: 10; justify-content: center;" bgcolor="79a8c3"][tr style="border: none!important"][td style="border: none!important;"][right][color=white][b][size=14]DESTAQUES[/size][/b][/color][/right][/td][/tr][/table]\n[table style="width: 100%; border-radius: 15px; border: none!important; overflow: hidden; position: relative; z-index: 1;line-height: 1.4em; margin: 0 auto;" bgcolor="EEEEF7"][tr style="border: none!important; overflow: hidden"][td style="border: none!important; overflow: hidden"]\n\n[justify]\n${blockDestaques || '[center]Sem destaques nesta semana.[/center]'}\n[/justify]\n[/tr][/td][/table]\n\n[table style="border: none!important; border-radius: 40px; overflow: hidden; width: 40%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); margin: -2% auto; top: 1.2em; right: 45%; position: relative; z-index: 10; justify-content: center;" bgcolor="93c47d"][tr style="border: none!important"][td style="border: none!important;"][right][color=white][b][size=14]POSITIVOS[/size][/b][/color][/right][/td][/tr][/table]\n[table style="width: 100%; border-radius: 15px; border: none!important; overflow: hidden; position: relative; z-index: 1;line-height: 1.4em; margin: 0 auto;" bgcolor="EEEEF7"][tr style="border: none!important; overflow: hidden"][td style="border: none!important; overflow: hidden"]\n\n[justify]\n${blockPositivos || '[center]Nenhum positivo.[/center]'}\n[/justify]\n[/tr][/td][/table]\n\n[table style="border: none!important; border-radius: 40px; overflow: hidden; width: 40%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); margin: -2% auto; top: 1.2em; right: 45%; position: relative; z-index: 10; justify-content: center;" bgcolor="e06666"][tr style="border: none!important"][td style="border: none!important;"][right][color=white][b][size=14]NEGATIVOS[/size][/b][/color][/right][/td][/tr][/table]\n[table style="width: 100%; border-radius: 15px; border: none!important; overflow: hidden; position: relative; z-index: 1;line-height: 1.4em; margin: 0 auto;" bgcolor="EEEEF7"][tr style="border: none!important; overflow: hidden"][td style="border: none!important; overflow: hidden"]\n\n[justify]\n${blockNegativos || '[center]Nenhum negativo.[/center]'}\n[/justify]\n[/tr][/td][/table]\n\n[table style="border: none!important; border-radius: 40px; overflow: hidden; width: 40%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); margin: -2% auto; top: 1.2em; right: 45%; position: relative; z-index: 10; justify-content: center;" bgcolor="9BAFB8"][tr style="border: none!important"][td style="border: none!important;"][right][color=white][b][size=14]CASO ESPECIAL[/size][/b][/color][/right][/td][/tr][/table]\n[table style="width: 100%; border-radius: 15px; border: none!important; overflow: hidden; position: relative; z-index: 1;line-height: 1.4em; margin: 0 auto;" bgcolor="EEEEF7"][tr style="border: none!important; overflow: hidden"][td style="border: none!important; overflow: hidden"]\n\n[justify]\n${blockOutros || '[center]Nenhum caso especial.[/center]'}\n[/justify]\n[/tr][/td][/table]\n\n[center][font=Poppins][table style="border: none!important; overflow: hidden; border-radius: 5px; width: auto; margin: 1px;"][tr style="border: none!important; overflow: hidden"]\n${footerBlocks}\n[/tr][/table][/font][/center][/td][/tr][/table]\n\n[size=11][color=white]<i class="fas fa-code"></i> Desenvolvido por [b].Brendon[/b] | Todos os direitos reservados à [b]Escola de Formação de Executivos[/b].[/color][/size]\n[/td][/tr][/table][/td][/tr][/table][/font]`;
    }

    // Função Copiar BBCode
    function copyBBCode() {
        const bbcode = generateBBCodeString();
        if(!bbcode) return;
        
        navigator.clipboard.writeText(bbcode).then(() => {
            const btn = document.getElementById('btn-copy');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> <span>Copiado!</span>';
            showToast("Código copiado para a área de transferência!", "success");
            setTimeout(() => { btn.innerHTML = originalText; }, 2000);
        }, () => {
            showToast("Erro ao copiar o código.", "error");
        });
    }

    // Função Postar Destaques (Professor apenas, T=7)
    async function postHighlights() {
        if(currentRankKey !== 'Professor') return;
        
        const btn = document.getElementById('btn-destaque');
        btn.disabled = true;
        btn.innerText = "Postando...";
        
        try {
            await fetchTopicTokens('38830'); 
        } catch(e) {
            showToast("Erro ao conectar com tópico de destaques.", "error");
            btn.disabled = false; btn.innerHTML = '<i class="fas fa-trophy"></i> <span>Postar Destaques</span>';
            return;
        }

        // 2. Gerar BBCode específico
        const bbcode = generateBBCodeString('highlight');

        // 3. Postar
        try {
            submitForumPost(bbcode);
            showToast("Destaques postados com sucesso!", "success");
        } catch (err) {
            console.error(err);
            showToast("Erro ao postar destaques.", "error");
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-trophy"></i> <span>Postar Destaques</span>';
            // Restaura tokens originais do cargo
            const config = RANK_CONFIG[currentRankKey];
            if(config) fetchTopicTokens(config.topicId); 
        }
    }

    // Função Postar Metas Original (TriggerPost)
    async function sendToSheet(metaTitle, cargo, situacao, nicks) {
        if (!nicks || nicks.trim() === '') return;
        const payload = { sheet: "Metas", rows: [[metaTitle, cargo, situacao, nicks]] };
        try {
            await fetch(LOG_SCRIPT_URL, {
                method: 'POST', mode: 'no-cors', 
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload)
            });
        } catch (error) { console.error("Erro log sheet", error); }
    }

    // ========================================================
    // LÓGICA DE MODAL DE CONFIRMAÇÃO DE POSTAGEM (ATUALIZADA)
    // ========================================================

    // Passo 1: Abre o modal e preenche os dados
   async function triggerPost() {
        if(!currentRenderData.length) return;
        
        // Gera o BBCode (Visual do Fórum)
        const bbcode = generateBBCodeString('post');
        const config = RANK_CONFIG[currentRankKey];
        const titleMeta = currentSheetTitle || "TÍTULO";
        const cargoFormatted = currentRankKey + "(a)";
        
        // --- FILTRAGEM E AGRUPAMENTO PARA A PLANILHA ---
        // Agora agrupa por código de status em vez de apenas Pos/Neg
        const groupedStatuses = {};

        currentRenderData.forEach((row) => {
            // 1. REGRA DE OURO: O Override manual tem prioridade total.
            let finalStatus = (row.userOverrideStatus && row.userOverrideStatus !== 'Selecione') 
                ? row.userOverrideStatus 
                : row.statusObj.code;
            
            // 2. Limpeza
            let cleanStatus = String(finalStatus).trim().toUpperCase().replace(/[\[\]]/g, '');

            // 3. Agrupamento
            if (!groupedStatuses[cleanStatus]) {
                groupedStatuses[cleanStatus] = [];
            }
            groupedStatuses[cleanStatus].push(row.nick);
        });

        // Prepara o objeto para envio posterior
        pendingPostData = {
            cargo: cargoFormatted,
            title: titleMeta,
            groupedStatuses: groupedStatuses
        };

        // --- ATUALIZA A UI DO MODAL ---
        document.getElementById('post-input-cargo').value = cargoFormatted;
        document.getElementById('post-input-title').value = titleMeta;
        document.getElementById('post-input-bbcode').value = bbcode;
        
        // Reseta estados visuais
        document.getElementById('bbcode-editor-container').classList.add('hidden');
        const btnToggleText = document.getElementById('btn-toggle-text');
        btnToggleText.innerText = "Editar BBCode";
        
        btnToggleText.onclick = () => {
             const container = document.getElementById('bbcode-editor-container');
             const isHidden = container.classList.contains('hidden');
             if(isHidden) {
                 container.classList.remove('hidden');
                 btnToggleText.innerText = "Ocultar Editor";
             } else {
                 container.classList.add('hidden');
                 btnToggleText.innerText = "Editar BBCode";
             }
        };
        
        const btnConfirm = document.getElementById('btn-modal-post-confirm');
        const btnCancel = document.getElementById('btn-modal-post-cancel');
        
        btnConfirm.disabled = false;
        btnConfirm.innerHTML = "Confirmar e Postar";
        
        btnCancel.disabled = false;
        btnCancel.innerText = "Cancelar";
        
        btnCancel.onclick = () => {
             document.getElementById('post-confirm-modal').classList.remove('open');
        };
        
        // Abre o modal
        document.getElementById('post-confirm-modal').classList.add('open');
    }

    // Passo 2: Executa a ação final ao confirmar
    async function confirmPostAction() {
        // Pega os valores (possivelmente editados) do modal
        const finalCargo = document.getElementById('post-input-cargo').value;
        const finalTitle = document.getElementById('post-input-title').value;
        const finalBBCode = document.getElementById('post-input-bbcode').value;

        // UI Feedback dentro do Modal
        const btnConfirm = document.getElementById('btn-modal-post-confirm');
        const btnCancel = document.getElementById('btn-modal-post-cancel');
        
        btnConfirm.disabled = true; 
        btnConfirm.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Enviando...';
        btnCancel.disabled = true;

        showToast("Processando postagem e registro...", "info");

        try {
            // 1. Posta no Fórum
            submitForumPost(finalBBCode);
            
            // 2. Envia para a Planilha (Iterando sobre TODOS os grupos encontrados)
            const groups = pendingPostData.groupedStatuses;
            const statusKeys = Object.keys(groups);
            
            for (let i = 0; i < statusKeys.length; i++) {
                const code = statusKeys[i];
                const nicks = groups[code];
                const nicksStr = nicks.join(' / ');
                
                // Mapeia o código (Ex: 'A' -> 'Positivo', 'L' -> 'Licença')
                const sheetStatus = SHEET_STATUS_MAP[code] || code;

                // Envia com pequeno delay entre requisições para não sobrecarregar
                await new Promise(r => setTimeout(r, 500));
                sendToSheet(finalTitle, finalCargo, sheetStatus, nicksStr);
            }
            
            // Feedback de Sucesso no Botão
            setTimeout(() => {
                btnConfirm.innerHTML = '<i class="fas fa-check"></i> Postado! Pode fechar.';
                btnConfirm.style.background = "#10b981"; // Verde
                btnCancel.disabled = false; // Permite fechar agora
                btnCancel.innerText = "Fechar";
                showToast("Postagem realizada e todos os status salvos!", "success");
            }, 3500);

        } catch (err) {
            console.error(err);
            showToast("Erro: " + err.message, "error");
            btnConfirm.disabled = false;
            btnConfirm.innerHTML = "Tentar Novamente";
            btnCancel.disabled = false;
        }
    }

    function submitForumPost(bbcodeMessage) {
        if (!forumTokens) throw new Error("Tokens do fórum não carregados.");
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = forumTokens.action;
        form.target = '_blank';
        form.style.display = 'none';
        forumTokens.inputs.forEach(inp => {
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = inp.name;
            hiddenField.value = inp.value;
            form.appendChild(hiddenField);
        });
        const messageField = document.createElement('textarea');
        messageField.name = 'message';
        messageField.value = bbcodeMessage;
        form.appendChild(messageField);
        document.body.appendChild(form);
        form.submit();
        setTimeout(() => document.body.removeChild(form), 2000);
    }
    // =========================================================
    // === MÓDULO MINISTÉRIO ===
    // =========================================================

    let ministryData = {
        date: "",
        ministers: { positive: [], negative: [] },
        interns: { positive: [], negative: [] },
        unknown: { positive: [], negative: [] }
    };

    const _originalToggleMedalSubTab = toggleMedalSubTab;
    toggleMedalSubTab = function(tab) {
        const generalView = document.getElementById('subview-general');
        const leadView = document.getElementById('subview-leadership');
        const minView = document.getElementById('subview-ministry');

        const tabGen = document.getElementById('subtab-general');
        const tabLead = document.getElementById('subtab-leadership');
        const tabMin = document.getElementById('subtab-ministry');

        // Reseta tudo
        generalView.classList.add('hidden');
        leadView.classList.add('hidden');
        minView.classList.add('hidden');
        
        tabGen.classList.remove('active');
        tabLead.classList.remove('active');
        tabMin.classList.remove('active');

        if(tab === 'general') {
            generalView.classList.remove('hidden');
            tabGen.classList.add('active');
        } else if (tab === 'leadership') {
            leadView.classList.remove('hidden');
            tabLead.classList.add('active');
        } else if (tab === 'ministry') {
            minView.classList.remove('hidden');
            tabMin.classList.add('active');
            if(Object.keys(membersCache).length === 0) fetchMembersData();
        }
    };

    function parseMinistryData() {
        const text = document.getElementById('min-input-text').value;
        const dateInput = document.getElementById('min-detected-date');
        
        // Reseta dados
        ministryData = { date: "", ministers: { positive: [], negative: [] }, interns: { positive: [], negative: [] }, unknown: { positive: [], negative: [] } };
        
        if(!text) { 
            dateInput.value = ""; 
            renderMinistryResults();
            return; 
        }

        const dateRegex = /(?:período de|meta.*de)\s+([0-9]{1,2}\s+[A-Za-zç]+\s+[0-9]{4}\s+(?:a|até)\s+[0-9]{1,2}\s+[A-Za-zç]+\s+[0-9]{4})/i;
        const dateMatch = text.match(dateRegex);
        
        if(dateMatch && dateMatch[1]) {
            ministryData.date = dateMatch[1].trim(); 
            dateInput.value = ministryData.date;
        } else {
            dateInput.value = "Data não detectada (Preencha manual no link se necessário)";
        }

        const lines = text.split('\n');
        
        lines.forEach(line => {
            if(!line.includes('•')) return;

            const parts = line.split('•')[1].trim().split(/\t|\s{2,}/);
            if(parts.length < 2) return;

            const nick = parts[0].trim();
            const statusRaw = parts[parts.length - 1].trim().toUpperCase();
            
            let isPositive = statusRaw.includes('REALIZADAS') && !statusRaw.includes('NÃO');
            let isNegative = statusRaw.includes('NÃO REALIZADAS');

            if (!isPositive && !isNegative) return; 

            const memberInfo = membersCache[nick.toLowerCase()];
            let category = 'unknown';

            if(memberInfo) {
                const cargo = memberInfo.cargo.toLowerCase();
                if(cargo.startsWith('ministr')) category = 'ministers';
                else if(cargo.startsWith('estagiári')) category = 'interns';
            }

            const targetArray = isPositive ? ministryData[category].positive : ministryData[category].negative;
            if(!targetArray.includes(nick)) targetArray.push(nick);
        });

        renderMinistryResults();
    }

    function renderMinistryResults() {
        const statusFilter = document.getElementById('min-status-filter').value;
        const resMinisters = document.getElementById('min-result-minister');
        const resInterns = document.getElementById('min-result-intern');
        const btnMin = document.getElementById('btn-post-minister');
        const btnInt = document.getElementById('btn-post-intern');
        const actionContainer = document.getElementById('min-negative-actions');

        const key = statusFilter === 'Positivo' ? 'positive' : 'negative';

        const listMin = ministryData.ministers[key];
        const listInt = ministryData.interns[key];
        
        resMinisters.innerText = listMin.length > 0 ? listMin.join(' / ') : "Nenhum";
        resInterns.innerText = listInt.length > 0 ? listInt.join(' / ') : "Nenhum";

        btnMin.parentElement.classList.remove('hidden');
        btnInt.parentElement.classList.remove('hidden');
        
        btnMin.disabled = listMin.length === 0;
        btnInt.disabled = listInt.length === 0;

        if(statusFilter === 'Positivo') {
            resMinisters.className = "text-sm font-bold text-green-600 font-mono break-all min-h-[40px]";
            resInterns.className = "text-sm font-bold text-green-600 font-mono break-all min-h-[40px]";
            
            btnMin.innerHTML = '<i class="fas fa-medal"></i> Postar Ministros (Positivo)';
            btnInt.innerHTML = '<i class="fas fa-medal"></i> Postar Estagiários (Positivo)';
            
            actionContainer.classList.add('hidden');

        } else {
            resMinisters.className = "text-sm font-bold text-red-600 font-mono break-all min-h-[40px]";
            resInterns.className = "text-sm font-bold text-red-600 font-mono break-all min-h-[40px]";

            btnMin.innerHTML = '<i class="fas fa-heart-broken"></i> Postar Ministros (Negativo)';
            btnInt.innerHTML = '<i class="fas fa-heart-broken"></i> Postar Estagiários (Negativo)';
            
            if(listMin.length > 0 || listInt.length > 0) {
                actionContainer.classList.remove('hidden');
            } else {
                actionContainer.classList.add('hidden');
            }
        }
    }

    function openMinistryLink(type) { 
        const responsible = document.getElementById('min-responsible').value;
        const date = ministryData.date || document.getElementById('min-detected-date').value;
        const statusFilter = document.getElementById('min-status-filter').value;
        
        if(!responsible) { showToast("Preencha o Responsável.", "warning"); return; }
        if(!date) { showToast("Data não detectada. Preencha na página.", "info"); }

        const key = statusFilter === 'Positivo' ? 'positive' : 'negative';
        const list = type === 'Ministro' ? ministryData.ministers[key] : ministryData.interns[key];
        
        if (list.length === 0) { showToast("Lista vazia.", "warning"); return; }

        const nicksStr = list.join(' / ');
        
        let points = type === 'Ministro' ? 15 : 15; 
        let motivo = "Cumprimento de meta do cargo de";

        if (statusFilter === 'Negativo') {
            points = points * -1;
            motivo = "Não cumprimento de meta do cargo de";
        }
        
        const params = new URLSearchParams({
            responsavel_med: responsible,
            grupo_tarefas: "Escola de Formação de Executivos", 
            periodo_med: date,
            gratificados_med: nicksStr,
            numero_med: points,
            cargo_med: type + "(a)",
            motivo_grat: motivo
        });
        
        window.open(`https://www.policiarcc.com/h17-postagem-de-medalhas-af?${params.toString()}`, '_blank');
    }

    async function sendMinistryPunishments() {
        const responsible = document.getElementById('min-responsible').value;
        if(!responsible) { showToast("Preencha o Responsável.", "warning"); return; }

        const allNegatives = [
            ...ministryData.ministers.negative, 
            ...ministryData.interns.negative
        ];

        if(allNegatives.length === 0) return;

        const btn = document.getElementById('btn-min-punishment');
        btn.disabled = true; btn.innerText = "Enviando...";

        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 30);
        
        const dateTimeStr = new Date().toLocaleString('pt-BR');
        const endDateStr = endDate.toLocaleDateString('pt-BR');
        const motivo = "Funções não realizadas (Ministério)";
        const tipo = "Advertência Interna";

        const rowsToSend = allNegatives.map(nick => [dateTimeStr, nick, tipo, motivo, endDateStr]);

        try {
            await fetch(LOG_SCRIPT_URL, {
                method: 'POST', mode: 'no-cors', 
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ sheet: "Advertência", rows: rowsToSend })
            });
            showToast("Punições ministeriais enviadas!", "success");
        } catch (error) {
            console.error(error); showToast("Erro ao enviar punições.", "error");
        } finally {
            btn.disabled = false; btn.innerHTML = '<i class="fas fa-gavel"></i> <span>Postar Punições</span>';
        }
    }

    async function openMinistryMP() {
        const allNegatives = [
            ...ministryData.ministers.negative, 
            ...ministryData.interns.negative
        ];
        
        if(allNegatives.length === 0) return;

        const confirmed = await showCustomConfirm(
            "Enviar MPs Ministeriais", 
            `Deseja enviar MP de advertência para <b>${allNegatives.length}</b> membros (Ministros/Estagiários)?`
        );
        if (!confirmed) return;

        const btn = document.getElementById('btn-min-mp');
        btn.disabled = true;

        for(let i=0; i < allNegatives.length; i++) {
            const nick = allNegatives[i];
            btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> (${i+1}/${allNegatives.length})`;
            
            const memberInfo = membersCache[nick.toLowerCase()];
            let roleLabel = "Membro do Ministério"; 
            if (memberInfo) roleLabel = memberInfo.cargo;
            
            const tipoCarta = "FUNÇÕES NÃO REALIZADAS";
            const infracao = `não realização das funções do cargo de [b]${roleLabel}[/b]`;
            const medalhas = "15 Medalhas Efetivas Negativas";
            const advertenciaTexto = " e uma Advertência Interna";

            const bbcode = `[font=Poppins][table style="border: none!important; border-radius: 15px; width: auto; margin: 0 auto; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);" bgcolor="#79a8c3"][tr style="border: none!important"][td style="border: none!important; padding: 7px"][table style="border: none!important; width: 100%; border-radius: 15px;" bgcolor="#25313a"][tr style="border: none!important"][td style="border: none!important; padding: 14px"][img]https://i.imgur.com/S1tKqgc.gif[/img]
[table style="border: none!important; border-radius: 40px; width: 40%; margin: -2% auto; position: relative;" bgcolor="79a8c3"][tr style="border: none!important"][td style="border: none!important"][center][color=white][b][size=16]CARTA DE ${tipoCarta}[/size][/b][/color][/center]
[/td][/tr][/table][table style="border: none!important; width: 100%; border-radius: 15px; line-height: 1.4em;" bgcolor="f8f8ff"][tr style="border: none!important"][td style="border: none!important"]
Saudações, [color=#79a8c3][b]{USERNAME}[/b][/color]

[justify]Venho informar que você está sendo punido(a) por ${infracao} na [b][color=#79a8c3]Escola de Formação de Executivos[/color][/b]. A penalização aplicada será: [color=#79a8c3][b]${medalhas}${advertenciaTexto}[/b][/color].[/justify]

[/td][/tr][/table]
[size=11][color=white]Desenvolvido por [b]Brendon[/b] | Todos os direitos reservados à [b]Escola de Formação de Executivos[/b].[/color][/size]
[/td][/tr][/table][/td][/tr][/table][/font]`;

            const subject = `[EFE] ${tipoCarta} - LEIA!`;
            
            await sendPrivateMessage(nick, subject, bbcode);
            await delay(5000); 
        }

        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-envelope"></i> Enviar MPs`;
        showToast("MPs enviadas.", "success");
    }
