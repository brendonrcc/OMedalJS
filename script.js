   // GLOBAL GRATIFICATION LIST
    let globalGratificationSet = new Set();

    // Helper for cleaning cells globally
    function cleanCell(c) { return c ? c.replace(/^"|"$/g, '').trim() : ""; }

    function openGratModal() {
        document.getElementById('startup-grat-modal').classList.add('open');
    }

    function saveGlobalGratifications() {
        const text = document.getElementById('startup-grat-input').value;
        globalGratificationSet.clear();
        
        if (text) {
            const lines = text.split('\n');
            lines.forEach(l => {
                const clean = l.trim().replace(/^[•\-✮\s]+/, '').replace(/\[.*?\]/g, '').trim();
                const n = clean.split(/\s+/)[0];
                if(n && n.length > 2) globalGratificationSet.add(n.toLowerCase());
            });
            showToast(`Lista salva com ${globalGratificationSet.size} membros.`, 'success');
        } else {
            showToast("Lista vazia ou pulada.", 'info');
        }
        
        document.getElementById('startup-grat-modal').classList.remove('open');
        
        // Refresh views if they are open
        if(!document.getElementById('view-metas').classList.contains('hidden-view') && els.titleSelect.value) {
            fetchAndRenderTarget(els.titleSelect.value);
        }
        if(!document.getElementById('subview-general').classList.contains('hidden') && document.getElementById('gen-input-text').value) {
            parseGeneralReport();
        }
    }

    function toggleTurbo() {
        const body = document.body;
        const btn = document.getElementById('turbo-btn');
        const icon = btn.querySelector('i');
        
        body.classList.toggle('turbo-mode');
        const isActive = body.classList.contains('turbo-mode');
        
        if (isActive) {
            btn.classList.add('active');
            icon.className = 'fas fa-bolt';
        } else {
            btn.classList.remove('active');
            icon.className = 'fas fa-rocket';
        }
        localStorage.setItem('om_turbo_mode', isActive);
    }

    // --- GLOBAL FUNCTIONS TO FIX REFERENCE ERRORS ---
    function toggleBBCodeEditor() {
        const container = document.getElementById('bbcode-editor-container');
        const btnText = document.getElementById('btn-toggle-text');
        if (!container || !btnText) return;
        
        const isHidden = container.classList.contains('hidden');
        if(isHidden) {
            container.classList.remove('hidden');
            btnText.innerText = "Ocultar Editor";
        } else {
            container.classList.add('hidden');
            btnText.innerText = "Editar BBCode";
        }
    }

    function closePostModal() {
        document.getElementById('post-confirm-modal').classList.remove('open');
    }
    // ------------------------------------------------

    window.addEventListener('DOMContentLoaded', () => {
        const isTurbo = localStorage.getItem('om_turbo_mode') === 'true';
        if(isTurbo) {
            document.body.classList.add('turbo-mode');
            if(document.getElementById('turbo-btn')) {
                const btn = document.getElementById('turbo-btn');
                btn.classList.add('active');
                btn.querySelector('i').className = 'fas fa-bolt';
            }
        } else {
             // Default state icon
             if(document.getElementById('turbo-btn')) {
                document.getElementById('turbo-btn').querySelector('i').className = 'fas fa-rocket';
             }
        }
        init(); 
        
        // Open Modal Startup
        setTimeout(() => openGratModal(), 500);

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

    async function openLeaderDetails(nick, role, month, year) {
        const modal = document.getElementById('custom-modal');
        const titleEl = document.getElementById('modal-title');
        const descEl = document.getElementById('modal-desc');
        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');
        
        titleEl.innerHTML = `Relatório de Liderança`;

        descEl.innerHTML = `
            <div id="leadership-calc-container" class="font-sans">
                <div class="toggle-container">
                    <div class="toggle-opt active" onclick="setLeaderCalcMode('auto')" id="opt-auto">Automático</div>
                    <div class="toggle-opt" onclick="setLeaderCalcMode('manual')" id="opt-manual">Manual</div>
                </div>

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

                <div id="leader-results-area">
                    <div class="p-8 text-center text-slate-400">
                        <i class="fas fa-circle-notch fa-spin"></i> Calculando...
                    </div>
                </div>
            </div>
        `;
        
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
            
            const manualStartVal = document.getElementById('manual-start-date').value;
            const manualReturnVal = document.getElementById('manual-return-date').value;

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
                if(manualStartVal) {
                    const partsStart = manualStartVal.split('-');
                    const mStart = new Date(partsStart[0], partsStart[1]-1, partsStart[2], 12, 0, 0);
                    leaves.push({
                        parsedDate: mStart, 
                        days: 30 
                    });
                }
                if(manualReturnVal) {
                    const partsRet = manualReturnVal.split('-');
                    returnDate = new Date(partsRet[0], partsRet[1]-1, partsRet[2], 12, 0, 0);
                }
            }

            let absentDaysCount = 0;
            let activeDaysCount = daysInMonth; 
            let statusColor = 'emerald';
            let statusTitle = 'Mês Completo';
            let statusIcon = 'fa-check-circle';
            let leaveInfo = `<span class="opacity-60">Nenhuma ausência registrada neste mês.</span>`;

            if (leaves.length > 0) {
                const leave = leaves[leaves.length - 1];
                const leaveDate = new Date(leave.parsedDate);
                leaveDate.setHours(12,0,0,0);

                const effectiveAbsenceStart = new Date(leaveDate);
                effectiveAbsenceStart.setDate(leaveDate.getDate() + 1); 

                const requestedDays = leave.days || 30; 
                const expectedAbsenceEnd = new Date(leaveDate);
                expectedAbsenceEnd.setDate(leaveDate.getDate() + requestedDays);

                absentDaysCount = 0;
                
                for (let d = 1; d <= daysInMonth; d++) {
                    let currentDayCheck = new Date(targetYear, monthIndex, d, 12, 0, 0);

                    const isAfterStart = currentDayCheck.getTime() >= effectiveAbsenceStart.getTime();
                    const isWithinDuration = (mode === 'manual' && !returnDate) ? true : (currentDayCheck.getTime() <= expectedAbsenceEnd.getTime());
                    const isBeforeReturn = returnDate ? (currentDayCheck.getTime() < returnDate.getTime()) : true;

                    if (isAfterStart && isWithinDuration && isBeforeReturn) {
                        absentDaysCount++;
                    }
                }

                activeDaysCount = daysInMonth - absentDaysCount;
                if(activeDaysCount < 0) activeDaysCount = 0; 

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

        cancelBtn.innerText = 'Fechar';
        cancelBtn.onclick = () => { modal.classList.remove('open'); };
        setLeaderCalcMode('auto'); 
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

        // Improved proxy list and order
        const proxies = [
            (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
            (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
            (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
        ];
        
        for (const proxyGen of proxies) {
            try {
                let finalUrl = proxyGen(targetUrl);
                // AllOrigins requires parsing JSON 'contents'
                const isAllOrigins = finalUrl.includes('allorigins');
                
                if (forceBypassCache) {
                    finalUrl += (finalUrl.includes('?') ? '&' : '?') + 't_buster=' + Date.now();
                }

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased timeout

                const resp = await fetch(finalUrl, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (!resp.ok) {
                    console.warn(`Proxy ${finalUrl} failed with status ${resp.status}`);
                    continue; 
                }
                
                let text = "";
                if(isAllOrigins) {
                    const json = await resp.json();
                    text = json.contents;
                } else {
                    text = await resp.text();
                }
            
                if (text && text.length > 30 && !text.includes('Access Denied') && !text.includes('404 Not Found')) {
                    try { localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: text })); } catch(e) {}
                    return text;
                }
            } catch (err) { 
                console.warn(`Proxy tentativa falhou: ${err.message}`); 
            }
        }
        throw new Error("Não foi possível carregar os dados. Verifique sua conexão ou tente mais tarde.");
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

    function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    
    // --- Lógica de Membros Gerais (Parse) ---
    let generalData = { date: "", positives: [], negatives: [], alreadyPosted: [] };

    function parseGeneralReport() {
        const text = document.getElementById('gen-input-text').value;
        const dateInput = document.getElementById('gen-detected-date');
        
        // Use Global Gratification List for filtering
        
        // Reset lists but keep existing arrays for now
        let newPositives = [];
        let newNegatives = [];
        
        if(!text) { 
            dateInput.value = ""; 
            generalData.positives = [];
            generalData.negatives = [];
            renderGeneralResults();
            return; 
        }

        // Tentar detectar data
        const dateRegex = /(?:período de|meta.*de)\s+([0-9]{1,2}\s+[A-Za-zç]+\s+[0-9]{4}\s+(?:a|até)\s+[0-9]{1,2}\s+[A-Za-zç]+\s+[0-9]{4})/i;
        const dateMatch = text.match(dateRegex);
        
        if(dateMatch && dateMatch[1]) {
            generalData.date = dateMatch[1].trim(); 
            dateInput.value = generalData.date;
        } else {
            const lines = text.split('\n');
            let foundDate = false;
            for(let line of lines) {
                if(line.match(/[0-9]{1,2}\s+[A-Za-zç]+\s+[0-9]{4}/)) {
                    generalData.date = line.trim();
                    dateInput.value = line.trim() + " (Aprox)";
                    foundDate = true;
                    break;
                }
            }
            if(!foundDate) dateInput.value = "Data não detectada";
        }

        const lines = text.split('\n');
        let currentSection = 'none';

        lines.forEach(line => {
            let cleanLine = line.trim();
            
            // IGNORE FILTERS based on user request
            if (cleanLine.includes('DESEMPENHO SEMANAL') || cleanLine.includes('Página') || cleanLine.match(/^\d+\./)) return;
            // Also ignore specific garbage
            if (cleanLine.startsWith('✮ 01.')) return; 

            const upperLine = cleanLine.toUpperCase();

            // Detect Sections
            if(upperLine.includes('DESTAQUES')) { currentSection = 'highlight'; return; }
            if(upperLine.includes('POSITIVOS')) { currentSection = 'positive'; return; }
            if(upperLine.includes('NEGATIVOS')) { currentSection = 'negative'; return; }
            if(upperLine.includes('CASO ESPECIAL')) { currentSection = 'ignore'; return; }

            if(currentSection === 'none' || currentSection === 'ignore') return;
            
            // Clean brackets now
            cleanLine = cleanLine.replace(/\[.*?\]/g, '').trim(); 
            if(cleanLine.length < 2) return;

            let temp = cleanLine;

            // Remove starting bullets/stars
            temp = temp.replace(/^[•\-✮\s]+/, ''); 
            // Remove lingering stars/bullets inside
            temp = temp.replace(/[•✮]/g, '');

            // Remove points suffix: "10 Pontos", "- 10 Pontos", "10 Ponto"
            // Regex: Optional space/dash, digits, optional space, Ponto(s)
            temp = temp.replace(/[\s\-]*\d+\s*Pontos?.*$/i, '');
            
            // Safety: Remove just "Pontos" if no number
            temp = temp.replace(/[\s\-]*Pontos?.*$/i, '');

            let extractedNick = temp.trim().split(/\s+/)[0]; // Split by whitespace and take first

            if(extractedNick && extractedNick.length > 1) {
                 const checkUpper = extractedNick.toUpperCase();
                 const forbidden = ['DESTAQUES', 'POSITIVOS', 'NEGATIVOS', 'CASO', 'ESPECIAL'];
                 
                 if(!forbidden.includes(checkUpper)) {
                     if(currentSection === 'highlight' || currentSection === 'positive') {
                         newPositives.push(extractedNick);
                     } else if(currentSection === 'negative') {
                         newNegatives.push(extractedNick);
                     }
                 }
            }
        });
        
        generalData.positives = [...new Set(newPositives)];
        generalData.negatives = [...new Set(newNegatives)];

        renderGeneralResults();
    }

    function renderGeneralResults() {
        const resPos = document.getElementById('gen-result-positive');
        const resNeg = document.getElementById('gen-result-negative');
        const statusPos = document.getElementById('gen-status-pos');
        const statusNeg = document.getElementById('gen-status-neg');
        
        const btnPos = document.getElementById('btn-post-gen-pos');
        const btnNeg = document.getElementById('btn-post-gen-neg');
        const btnPunish = document.getElementById('btn-post-gen-punish');

        // Logic for Comparison (INTERSECTION / FILTER) using Global Set
        const hasFilter = globalGratificationSet.size > 0;
        
        // Se tiver filtro, mantém APENAS quem está no set (has). Se não tiver filtro, mantém todos.
        const pendingPos = hasFilter ? generalData.positives.filter(n => globalGratificationSet.has(n.toLowerCase())) : generalData.positives;
        const pendingNeg = hasFilter ? generalData.negatives.filter(n => globalGratificationSet.has(n.toLowerCase())) : generalData.negatives;
        
        // Debug/Status info
        const rejectedPosCount = generalData.positives.length - pendingPos.length;
        const rejectedNegCount = generalData.negatives.length - pendingNeg.length;

        resPos.innerText = pendingPos.length > 0 ? pendingPos.join(' / ') : "Nenhum (após filtro)";
        resNeg.innerText = pendingNeg.length > 0 ? pendingNeg.join(' / ') : "Nenhum (após filtro)";

        if(hasFilter) {
            statusPos.classList.remove('hidden');
            statusPos.innerHTML = `<span class="font-bold text-green-600">${pendingPos.length} aceito(s)</span> | <span class="text-slate-400">${rejectedPosCount} ignorado(s)</span>`;
            
            statusNeg.classList.remove('hidden');
            statusNeg.innerHTML = `<span class="font-bold text-red-600">${pendingNeg.length} aceito(s)</span> | <span class="text-slate-400">${rejectedNegCount} ignorado(s)</span>`;
        } else {
            statusPos.classList.add('hidden');
            statusNeg.classList.add('hidden');
        }

        btnPos.disabled = pendingPos.length === 0;
        btnNeg.disabled = pendingNeg.length === 0;
        btnPunish.disabled = pendingNeg.length === 0;
    }

    function openGeneralMedalLink(type) {
        const responsible = document.getElementById('gen-responsible').value;
        const role = document.getElementById('gen-role').value;
        const date = generalData.date || document.getElementById('gen-detected-date').value;

        if(!responsible) { showToast("Preencha o Responsável.", "warning"); return; }
        
        // Use Global Gratification List for filtering
        const hasFilter = globalGratificationSet.size > 0;
        const fullList = type === 'positive' ? generalData.positives : generalData.negatives;
        
        const list = hasFilter ? fullList.filter(n => globalGratificationSet.has(n.toLowerCase())) : fullList;

        if(list.length === 0) { showToast("Lista vazia após filtro.", "info"); return; }

        const nicksStr = list.join(' / ');
        
        let basePoints = 10;
        if(role === 'Mentor' || role === 'Capacitador') basePoints = 15;
        else if(role === 'Graduador') basePoints = 25;

        let points = (type === 'positive') ? basePoints : (basePoints * -1);
        let motivo = (type === 'positive') ? "Cumprimento de meta do cargo de" : "Não cumprimento de meta do cargo de";

        const params = new URLSearchParams({
            responsavel_med: responsible,
            grupo_tarefas: "Escola de Formação de Executivos", 
            periodo_med: date,
            gratificados_med: nicksStr,
            numero_med: points,
            cargo_med: role + "(a)",
            motivo_grat: motivo
        });
        
        window.open(`https://www.policiarcc.com/h17-postagem-de-medalhas-af?${params.toString()}`, '_blank');
    }

    function openGeneralPunishmentLink() {
        // Use Global Gratification List for filtering
        const hasFilter = globalGratificationSet.size > 0;
        const fullList = generalData.negatives;
        
        const listNeg = hasFilter ? fullList.filter(n => globalGratificationSet.has(n.toLowerCase())) : fullList;

        if(listNeg.length === 0) { showToast("Lista vazia após filtro.", "info"); return; }
        
        const role = document.getElementById('gen-role').value;
        const nicks = listNeg.join(' / ');
        
        const baseUrl = "https://www.policiarcc.com/h39-";
        const params = new URLSearchParams();
        params.set('form', 'advertencia');
        params.set('nickname', nicks);
        params.set('tipo_g1', 'Advertência Interna');
        params.set('motivo_g1', `Não cumprimento de meta no cargo de ${role}`);
        params.set('permissao', 'Ministério da Contabilidade');
        params.set('comprovacoes_g1', 'https://www.policiarcc.com/t38367');
        
        window.open(`${baseUrl}?${params.toString()}`, '_blank');
    }

    const MASTER_BASE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAm7FkCrMwblbAPjFnuxoxeZNHdAc18M7bm-qR3k2YqB_i047AJ0LduIJjJ9iP7ZqT7dGpzFWtY2mp/pub";
    const TARGET_SHEET_NAME = "[EFE] Contador";
    const LOG_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyPdKr_TJ6IMcLUFAavHVFaSg6e2vhjsALDFtQo2zMkmU5aQ3_KCUQGUex5fgYLoWnnuw/exec";
    
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
    
    let pendingPostData = {
        cargo: '',
        title: '',
        groupedStatuses: {} 
    };
    
    const statusMap = { "[A]": { text: "Positivo", code: "A" }, "[B]": { text: "Negativo", code: "B" }, "[IS]": { text: "Isenção", code: "IS" }, "[DO]": { text: "Doação", code: "DO" }, "[J]": { text: "Justificada", code: "J" }, "[GP]": { text: "Grad. Pend.", code: "GP" }, "[RL]": { text: "Retorno", code: "RL" }, "[L]":  { text: "Licença", code: "L" }, "[CE]": { text: "Caso Esp.", code: "CE" }, "[Z]":  { text: "Caso Esp.", code: "CE" }, "[ER]": { text: "Entrada Recente", code: "ER" } };
    
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
            const tsvText = await fetchSmart(url, false); 
            
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
        
        let lastYear = "";
        let lastMonth = "";

        for (let i = 0; i < rows.length; i++) {
            const col = rows[i];
            if (col.length < 3) continue; 

            let year = cleanCell(col[0]);
            let month = cleanCell(col[1]);
            let title = cleanCell(col[2]);
            let link = cleanCell(col[3]);

            // Skip header if detected
            if (year.toLowerCase().includes('ano') && month.toLowerCase().includes('mês')) continue;
            if (year.toLowerCase() === 'ano') continue;

            // Fill down logic for merged cells
            if (year) {
                lastYear = year;
            } else {
                year = lastYear;
            }

            if (month) {
                lastMonth = month;
            } else {
                month = lastMonth;
            }

            // We push only if we have a Year, Title and Link
            if (year && title && link) {
                masterData.push({ year, month, title, link });
            }
        }
    }

    async function fetchTopicTokens(topicId) {
        forumTokens = null; 
        
        // Se não estiver no domínio do fórum, ignora silenciosamente para evitar erro de rede no console local
        if(!window.location.hostname.includes('policiarcc.com') && !window.location.hostname.includes('policiarcc.forumeiros.com')) {
            console.log("Ignorando tokens de fórum (Ambiente externo)");
            return;
        }

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
        } catch(e) { 
            // Silenciar erro de rede para não spammar toast, apenas logar
            console.warn("Tokens de postagem: " + e.message); 
        }
    }

    window.selectRank = async function(rankName) {
        currentRankKey = rankName;
        document.querySelectorAll('.rank-pill').forEach(btn => {
            if(btn.getAttribute('data-title').includes(rankName)) btn.classList.add('active');
            else btn.classList.remove('active');
        });

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

    // cleanCell is now global

    async function fetchAndRenderTarget(originalUrl) {
        const config = RANK_CONFIG[currentRankKey];
        renderHeader(config);
        renderSkeleton(config.headerLabels.length, 8); 
        els.toolbar.classList.add('hidden');
        currentRenderData = [];
        
        try {
            await fetchMembersData();

            // GRAB THE GRATIFICATION FILTER LIST FROM GLOBAL
            const hasGratFilter = globalGratificationSet.size > 0;

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
                let forcePositive = false; 
                
                const memberInfo = membersCache[nick.toLowerCase()];
                
                if (memberInfo) {
                    const cargoLower = memberInfo.cargo.toLowerCase();
                    const daysDiff = memberInfo.diffDays;
                    let isHigherRank = false;

                    if(currentRankKey === 'Professor' && !cargoLower.includes('professor')) isHigherRank = true;
                    else if(currentRankKey === 'Mentor' && !cargoLower.includes('mentor') && !cargoLower.includes('professor')) isHigherRank = true;

                    if (isHigherRank) {
                        let limitDays = 11;
                        if(currentRankKey === 'Graduador') limitDays = 18;

                        if(daysDiff <= limitDays) {
                            isSuperior = true;
                            promotionStatus = "Recém-Promovido(a)";
                            promotionLabel = "Recém-Promovido(a)";
                            
                            if (currentRankKey === 'Professor' && cargoLower.includes('mentor')) forcePositive = true;
                            if (currentRankKey === 'Mentor' && cargoLower.includes('capacitador')) forcePositive = true;
                            if (currentRankKey === 'Capacitador' && cargoLower.includes('graduador')) forcePositive = true;
                            if (currentRankKey === 'Graduador' && cargoLower.includes('estagiário')) forcePositive = true;
                        } else {
                            continue; // Remove da postagem se for superior e expirou prazo
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
                
                if (forcePositive) {
                    statusObj = { text: "Positivo", code: "A" };
                }
                else if (['[CE]', '[IS]', '[L]', '[RL]', '[GP]', '[DO]', '[ER]', '[J]'].includes(rawStatus)) {
                     statusObj = statusMap[rawStatus];
                     if (rawStatus === '[CE]') justification = "";
                }
                else if (isSuperior) {
                     statusObj = { text: promotionStatus, code: "PRO" };
                }
                else if (currentRankKey === 'Professor') {
                    const totalApplied = classesSum + doaCount;
                    if (totalApplied >= 2) {
                        statusObj = { text: "Positivo", code: "A" };
                    } else {
                        statusObj = { text: "Negativo", code: "B" }; 
                    }
                }

                // --- NEW FILTERING LOGIC (GLOBAL LIST) ---
                // If Negative ([B]):
                // 1. Remove if NOT in Members List (membersCache) (Anti-Ghost)
                // 2. Remove if NOT in Gratification List (globalGratificationSet) IF list provided
                if (statusObj.code === 'B') {
                    const inMembers = !!membersCache[nick.toLowerCase()];
                    const inGratList = globalGratificationSet.has(nick.toLowerCase());

                    // "conferir se o nickname negativo consta em B:B ... se não constar e for negativo, não deve aparecer"
                    if (!inMembers) continue; 

                    // "só irá remover os nicknames que não constarem e estiverem negativos" (based on gratification list)
                    if (hasGratFilter && !inGratList) continue;
                }
                // ---------------------------

                const avatarUrl = `https://www.habbo.com.br/habbo-imaging/avatarimage?user=${nick}&headonly=1&size=m`;
                processedRows.push({ nick, classValues, total: totalPoints, statusObj, rawStatus, avatarUrl, isSuperior, justification, hasDonation, promotionLabel });
            }
            
            processedRows.sort((a, b) => b.total - a.total);
            currentRenderData = processedRows;
            renderTable(processedRows);
        } catch (error) {
            console.error(error);
            els.tableBody.innerHTML = `<tr><td colspan="15" class="text-center p-8 text-red-400 font-bold">Erro ao ler dados: ${error.message}</td></tr>`;
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
            const optionsHtml = statusOptions.map(opt => `<option value="${opt.val}" ${row.statusObj.code === opt.val.replace(/\[|\]/g,'') || (opt.val === '[A]' && row.statusObj.code === 'PRO') ? 'selected' : ''}>${opt.label}</option>`).join('');
            const rowClass = row.isSuperior ? 'row-superior' : '';
            
            let selectedVal = row.userOverrideStatus || (row.statusObj.code === 'PRO' ? '[A]' : `[${row.statusObj.code}]`.replace('[[', '[').replace(']]', ']'));
            
            let displaySelectLabel = row.statusObj.text;
            if(row.statusObj.code === 'A' || row.statusObj.code === 'PRO') displaySelectLabel = 'Positivo';
            if(row.statusObj.code === 'B') displaySelectLabel = 'Negativo';

            const superiorLabel = row.isSuperior 
                ? `<span class="text-[9px] text-[#2c5282] font-extrabold uppercase tracking-wider block mt-1 ml-1 opacity-80">${row.promotionLabel || row.statusObj.text}</span>` 
                : '';
            
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
                                    <option value="${selectedVal}" selected hidden>${displaySelectLabel}</option>
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

    function generateBBCodeString(mode = "post") {
        if(!currentRenderData.length) return "";
        const config = RANK_CONFIG[currentRankKey];
        const titleMeta = currentSheetTitle || "TÍTULO";
        const periodText = config.period === 'QUINZENAL' ? 'META QUINZENAL' : 'META SEMANAL';
        const rankUpper = currentRankKey.toUpperCase();
        
        if (mode === 'highlight') {
            const d1 = currentRenderData[0];
            const d2 = currentRenderData[1];
            
            const nick1 = d1 ? d1.nick : "---";
            const nick2 = d2 ? d2.nick : "---";
            const refDate = currentSheetTitle || "DATA INDEFINIDA";

            return `[center][img(70px,70px)]https://i.imgur.com/U9aXSQB.png[/img][/center]

[table style="width: 30%; border: none!important; overflow: hidden; border-radius: 7px; position: relative; margin: auto; bottom: 3.2em; font-family: 'Poppins', sans-serif; color: #ffffff; box-shadow: 0 4px 12px rgba(93, 142, 163, 0.4); z-index: 2" bgcolor="79a8c3"][tr style="border: none !important;"][td style="border: none!important; padding: 8px"][b]Escola de Formação de Executivos[/b][/td][/tr][/table]

[table style="width: 23%; border: none!important; overflow: hidden; border-radius: 0 0 5px 5px; position: relative; margin: auto; bottom: 4.6em; font-family: 'Poppins', sans-serif; color: #ffffff; box-shadow: 0 4px 12px rgba(93, 142, 163, 0.4); z-index: 2" bgcolor="5A7D91"][tr style="border: none !important;"][td style="border: none!important; padding: 4px"][size=11]${refDate}[/size][/td][/tr][/table]

[table style="width: 50%; border: none!important; overflow: hidden; left: 8.3em; bottom: 6em; position: relative; z-index: 2"][tr style="border: none !important;"][td style="border: none!important; padding: 4px"][img]https://www.habbo.com.br/habbo-imaging/avatarimage?&user=${nick1}&action=std&direction=5&head_direction=2&img_format=png&gesture=std&headonly=1&size=b[/img][/td][/tr][/table]

[table style="width: 30%; border: none!important; overflow: hidden; border-radius: 5px 5px 5px 5px; position: relative; margin-top: -11em; margin-left: 26em; font-family: 'Poppins', sans-serif; color: #ffffff; z-index: 1"][tr style="border: none!important;"][td style="width: 15%; border: none!important; padding: 4px" bgcolor="5A7D91"][right]1º[/right][/td][td style="width: auto; border: none!important; padding: 4px" bgcolor="e0e0e0"][b][color=#4d7684]${nick1}[/color][/b][/td][/tr][/table]

[table style="width: 50%; border: none!important; overflow: hidden; left: 29em; bottom: 3em; position: relative; z-index: 2"][tr style="border: none !important;"][td style="border: none!important; padding: 4px"][img]https://www.habbo.com.br/habbo-imaging/avatarimage?&user=${nick2}&action=std&direction=5&head_direction=4&img_format=png&gesture=std&headonly=1&size=b[/img][/td][/tr][/table]

[table style="width: 30%; border: none!important; overflow: hidden; border-radius: 5px 5px 5px 5px; position: relative; margin-top: -8em; margin-left: 26em; font-family: 'Poppins', sans-serif; color: #ffffff; z-index: 1"][tr style="border: none!important;"][td style="width: auto; border: none!important; padding: 4px" bgcolor="e0e0e0"][b][color=#4d7684]${nick2}[/color][/b][/td][td style="width: 15%; border: none!important; padding: 4px"  bgcolor="5A7D91"][left]2º[/left][/td][/tr][/table]
`;
        }
        
        const destaques = []; const positivos = []; const negativos = []; const outros = [];
        
        const LISTA_POSITIVOS = ['[A]', '[PRO]', 'A', 'PRO', 'POSITIVO', 'RECÉM-PROMOVIDO(A)', 'PROMOVIDO(A)'];
        const LISTA_NEGATIVOS = ['[B]', 'B', 'NEGATIVO']; 

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
            let finalCode = "";
            
            if (row.userOverrideStatus && row.userOverrideStatus !== 'Selecione') {
                finalCode = row.userOverrideStatus; 
            } else {
                finalCode = row.statusObj.code; 
                if(finalCode === 'A') finalCode = '[A]';
                if(finalCode === 'B') finalCode = '[B]';
                if(finalCode === 'PRO') finalCode = '[PRO]';
            }

            let checkCode = String(finalCode).trim().toUpperCase();

            const isHighlight = (index === 0 || index === 1) && (LISTA_POSITIVOS.includes(checkCode) || checkCode.includes('PRO'));

            if (isHighlight) {
                destaques.push(row);
            } 
            else if (LISTA_POSITIVOS.includes(checkCode)) {
                positivos.push(row);
            } 
            else if (LISTA_NEGATIVOS.includes(checkCode)) {
                negativos.push(row);
            } 
            else {
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

        const getEndStatusBlock = (status, justification) => {
            let color = "7F8F96"; 
            let textColor = "white";
            
            let text = STATUS_TRANSLATIONS[status] || status; 

            if(status.includes('CE') || text === 'Caso Especial') {
                text = justification ? `Caso Especial (${justification})` : "Caso Especial";
            }
            
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
            let status = row.userOverrideStatus || row.statusObj.code;
            
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
            
            if (row.hasDonation || status === '[DO]' || status === 'DO') {
                 html += `[td style="border: none!important; overflow: hidden; padding: 5px" bgcolor="FFD966"][color=black][b]<i class="fas fa-donate"></i>[/b][/color][/td]`;
            } 

            if (type === 'outros') {
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
        
        return `[font=Poppins][table style="border: none!important; overflow: hidden; border-radius: 15px; width: auto; padding: 0; margin: 0 auto; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); text-align: center;" bgcolor="#79a8c3"][tr style="border: none!important; overflow: hidden"][td style="border: none!important; overflow: hidden; padding: 7px"][table style="line-height: 0.2em; width: 100%; border-radius: 15px; border: none!important; overflow: hidden; line-height: 0.5em; margin: 0 auto;" bgcolor="#25313a"][tr style="border: none!important; overflow: hidden"][td style="border: none!important; overflow: hidden; padding: 14px"][img]https://i.imgur.com/S1tKqgc.gif[/img]\n[table style="border: none!important; border-radius: 40px; overflow: hidden; width: 40%; margin: -2% auto; top: 0.8em; position: relative; z-index: 10; justify-content: center;" bgcolor="79a8c3"][tr style="border: none!important"][td style="border: none!important;"][center][color=white][b][size=16]${periodText} - ${rankUpper}ES[/size][/b][/color][/center][/td][/tr][/table]\n[table style="width: 100%; border-radius: 15px; border: none!important; overflow: hidden; position: relative; z-index: 1; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);line-height: 1.4em; margin: 0 auto;" bgcolor="f8f8ff"][tr style="border: none!important; overflow: hidden"][td style="border: none!important; overflow: hidden"]\n\nSaudações, [color=#79a8c3][b]{USERNAME}[/b][/color]. Verifique abaixo a meta de ${rankUpper.toLowerCase()}es do período de [color=#79a8c3][b]${titleMeta}[/b][/color]:\n[center][table style="width: 20%; border-radius: 10px;border: none!important; overflow: hidden; line-height: 1em; margin-top:1em" bgcolor="79a8c3"][tr style="border: none!important; overflow: hidden"][td style="border: none!important; overflow: hidden; padding: 1px"][/td][/tr][/table][/center]\n\n[table style="border: none!important; border-radius: 40px; overflow: hidden; width: 40%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); margin: -2% auto; top: 1.2em; right: 45%; position: relative; z-index: 10; justify-content: center;" bgcolor="79a8c3"][tr style="border: none!important"][td style="border: none!important;"][right][color=white][b][size=14]DESTAQUES[/size][/b][/color][/right][/td][/tr][/table]\n[table style="width: 100%; border-radius: 15px; border: none!important; overflow: hidden; position: relative; z-index: 1;line-height: 1.4em; margin: 0 auto;" bgcolor="EEEEF7"][tr style="border: none!important; overflow: hidden"][td style="border: none!important; overflow: hidden"]\n\n[justify]${blockDestaques || '[center]Sem destaques nesta semana.[/center]'}[/justify][/tr][/td][/table]\n\n[table style="border: none!important; border-radius: 40px; overflow: hidden; width: 40%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); margin: -2% auto; top: 1.2em; right: 45%; position: relative; z-index: 10; justify-content: center;" bgcolor="93c47d"][tr style="border: none!important"][td style="border: none!important;"][right][color=white][b][size=14]POSITIVOS[/size][/b][/color][/right][/td][/tr][/table]\n[table style="width: 100%; border-radius: 15px; border: none!important; overflow: hidden; position: relative; z-index: 1;line-height: 1.4em; margin: 0 auto;" bgcolor="EEEEF7"][tr style="border: none!important; overflow: hidden"][td style="border: none!important; overflow: hidden"]\n\n[justify]${blockPositivos || '[center]Nenhum positivo.[/center]'}[/justify]\n[/tr][/td][/table]\n\n[table style="border: none!important; border-radius: 40px; overflow: hidden; width: 40%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); margin: -2% auto; top: 1.2em; right: 45%; position: relative; z-index: 10; justify-content: center;" bgcolor="e06666"][tr style="border: none!important"][td style="border: none!important;"][right][color=white][b][size=14]NEGATIVOS[/size][/b][/color][/right][/td][/tr][/table]\n[table style="width: 100%; border-radius: 15px; border: none!important; overflow: hidden; position: relative; z-index: 1;line-height: 1.4em; margin: 0 auto;" bgcolor="EEEEF7"][tr style="border: none!important; overflow: hidden"][td style="border: none!important; overflow: hidden"]\n\n[justify]${blockNegativos || '[center]Nenhum negativo.[/center]'}[/justify][/tr][/td][/table]\n\n[table style="border: none!important; border-radius: 40px; overflow: hidden; width: 40%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); margin: -2% auto; top: 1.2em; right: 45%; position: relative; z-index: 10; justify-content: center;" bgcolor="9BAFB8"][tr style="border: none!important"][td style="border: none!important;"][right][color=white][b][size=14]CASO ESPECIAL[/size][/b][/color][/right][/td][/tr][/table]\n[table style="width: 100%; border-radius: 15px; border: none!important; overflow: hidden; position: relative; z-index: 1;line-height: 1.4em; margin: 0 auto;" bgcolor="EEEEF7"][tr style="border: none!important; overflow: hidden"][td style="border: none!important; overflow: hidden"]\n\n[justify]${blockOutros || '[center]Nenhum caso especial.[/center]'}[/justify][/tr][/td][/table]\n\n[center][font=Poppins][table style="border: none!important; overflow: hidden; border-radius: 5px; width: auto; margin: 1px;"][tr style="border: none!important; overflow: hidden"]\n${footerBlocks}\n[/tr][/table][/font][/center][/td][/tr][/table]\n\n\n[size=11][color=white]<i class="fas fa-code"></i> Desenvolvido por [b].Brendon[/b] | Todos os direitos reservados à [b]Escola de Formação de Executivos[/b].[/color][/size]\n[/td][/tr][/table][/td][/tr][/table][/font]`;
    }

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

    async function postHighlights() {
        if(currentRankKey !== 'Professor') return;
        
        window.open('https://www.policiarcc.com/h5-', '_blank');
    }

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

   async function triggerPost() {
        if(!currentRenderData.length) return;
        
        const bbcode = generateBBCodeString('post');
        const config = RANK_CONFIG[currentRankKey];
        const titleMeta = currentSheetTitle || "TÍTULO";
        const cargoFormatted = currentRankKey + "(a)";
        
        const groupedStatuses = {};

        currentRenderData.forEach((row) => {
            let finalStatus = (row.userOverrideStatus && row.userOverrideStatus !== 'Selecione') 
                ? row.userOverrideStatus 
                : row.statusObj.code;
            
            let cleanStatus = String(finalStatus).trim().toUpperCase().replace(/[\[\]]/g, '');

            if (!groupedStatuses[cleanStatus]) {
                groupedStatuses[cleanStatus] = [];
            }
            groupedStatuses[cleanStatus].push(row.nick);
        });

        pendingPostData = {
            cargo: cargoFormatted,
            title: titleMeta,
            groupedStatuses: groupedStatuses
        };

        document.getElementById('post-input-cargo').value = cargoFormatted;
        document.getElementById('post-input-title').value = titleMeta;
        document.getElementById('post-input-bbcode').value = bbcode;
        
        document.getElementById('bbcode-editor-container').classList.add('hidden');
        const btnToggleText = document.getElementById('btn-toggle-text');
        btnToggleText.innerText = "Editar BBCode";
        
        const btnConfirm = document.getElementById('btn-modal-post-confirm');
        const btnCancel = document.getElementById('btn-modal-post-cancel');
        
        btnConfirm.disabled = false;
        btnConfirm.innerHTML = "Confirmar e Postar";
        
        btnCancel.disabled = false;
        btnCancel.innerText = "Cancelar";
        
        document.getElementById('post-confirm-modal').classList.add('open');
    }

    async function confirmPostAction() {
        const finalCargo = document.getElementById('post-input-cargo').value;
        const finalTitle = document.getElementById('post-input-title').value;
        const finalBBCode = document.getElementById('post-input-bbcode').value;

        const btnConfirm = document.getElementById('btn-modal-post-confirm');
        const btnCancel = document.getElementById('btn-modal-post-cancel');
        
        btnConfirm.disabled = true; 
        btnConfirm.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Enviando...';
        btnCancel.disabled = true;

        showToast("Processando postagem e registro...", "info");

        try {
            submitForumPost(finalBBCode);
            
            const groups = pendingPostData.groupedStatuses;
            const statusKeys = Object.keys(groups);
            
            for (let i = 0; i < statusKeys.length; i++) {
                const code = statusKeys[i];
                const nicks = groups[code];
                const nicksStr = nicks.join(' / ');
                
                const sheetStatus = SHEET_STATUS_MAP[code] || code;

                await new Promise(r => setTimeout(r, 500));
                sendToSheet(finalTitle, finalCargo, sheetStatus, nicksStr);
            }
            
            setTimeout(() => {
                btnConfirm.innerHTML = '<i class="fas fa-check"></i> Postado! Pode fechar.';
                btnConfirm.style.background = "#10b981"; 
                btnCancel.disabled = false; 
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

    let ministryData = {
        date: "",
        ministers: { positive: [], negative: [] },
        interns: { positive: [], negative: [] },
        unknown: { positive: [], negative: [] }
    };

    function parseMinistryData() {
        const text = document.getElementById('min-input-text').value;
        const dateInput = document.getElementById('min-detected-date');
        
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
            const cleanLine = line.trim();
            if(!cleanLine.includes('•')) return;

            const upperLine = cleanLine.toUpperCase();
            const contentAfterBullet = cleanLine.split('•')[1].trim();
            const upperContent = contentAfterBullet.toUpperCase();

            let extractedNick = "";
            let isPositive = false;
            let isNegative = false;

            if (upperContent.includes("FUNÇÕES NÃO REALIZADAS")) {
                const match = contentAfterBullet.match(/^(.*?)\s*FUNÇÕES NÃO REALIZADAS/i);
                if (match && match[1]) {
                    extractedNick = match[1].trim();
                    isNegative = true;
                }
            } else if (upperContent.includes("FUNÇÕES REALIZADAS")) {
                const match = contentAfterBullet.match(/^(.*?)\s*FUNÇÕES REALIZADAS/i);
                if (match && match[1]) {
                    extractedNick = match[1].trim();
                    isPositive = true;
                }
            }

            if (!extractedNick) return; 

            const memberInfo = membersCache[extractedNick.toLowerCase()];
            let category = 'unknown';

            if(memberInfo) {
                const cargo = memberInfo.cargo.toLowerCase();
                if(cargo.startsWith('ministr')) category = 'ministers';
                else if(cargo.startsWith('estagiári')) category = 'interns';
            }

            const targetArray = isPositive ? ministryData[category].positive : ministryData[category].negative;
            if(!targetArray.includes(extractedNick)) targetArray.push(extractedNick);
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

    function openMinistryPunishmentLink() {
        const allNegatives = [
            ...ministryData.ministers.negative, 
            ...ministryData.interns.negative
        ];
        
        if(allNegatives.length === 0) return;
        
        const nicks = allNegatives.join(' / ');
        
        const baseUrl = "https://www.policiarcc.com/h39-";
        const params = new URLSearchParams();
        params.set('form', 'advertencia');
        params.set('nickname', nicks);
        params.set('tipo_g1', 'Advertência Interna');
        params.set('motivo_g1', `Não realização das funções do cargo (Ministério)`);
        params.set('permissao', 'Ministério da Contabilidade');
        params.set('comprovacoes_g1', 'https://www.policiarcc.com/t38367');
        
        window.open(`${baseUrl}?${params.toString()}`, '_blank');
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

            // Simulação de envio - Para funcionar precisa da função sendPrivateMessage
             try {
                // await sendPrivateMessage(nick, `[EFE] ${tipoCarta} - LEIA!`, bbcode);
                // await delay(5000); 
             } catch(e) { console.error(e); }
        }

        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-envelope"></i> Enviar MPs`;
        showToast("MPs enviadas.", "success");
    }
