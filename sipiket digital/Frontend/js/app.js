// Global State
let currentUser = null;
let currentKelas = null;

// API Base URL
const API_URL = 'http://localhost:3000/api';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    loadMasterData();
    setupEventListeners();
});

// Check Session
async function checkSession() {
    try {
        const response = await fetch(`${API_URL}/auth/check`);
        const data = await response.json();
        
        if (data.authenticated) {
            currentUser = data.user;
            showDashboard();
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Session check error:', error);
        showLogin();
    }
}

// Load Master Data
async function loadMasterData() {
    try {
        const response = await fetch(`${API_URL}/auth/master-data`);
        const data = await response.json();
        
        if (data.success) {
            populateJurusan(data.jurusan);
            populateKelas(data.kelas);
        }
    } catch (error) {
        console.error('Load master data error:', error);
    }
}

// Populate Jurusan
function populateJurusan(jurusan) {
    const select = document.getElementById('jurusanSelect');
    jurusan.forEach(j => {
        const option = document.createElement('option');
        option.value = j.id;
        option.textContent = j.nama_jurusan;
        select.appendChild(option);
    });
}

// Populate Kelas
function populateKelas(kelas) {
    const select = document.getElementById('kelasSelect');
    kelas.forEach(k => {
        const option = document.createElement('option');
        option.value = k.id;
        option.textContent = k.nama_kelas;
        select.appendChild(option);
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Login Form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Mode Login Change
    document.getElementById('modeLogin').addEventListener('change', (e) => {
        const label = document.getElementById('nisLabel');
        label.textContent = e.target.value === 'siswa' 
            ? 'Nomor Induk Siswa (NIS)' 
            : 'Username Admin';
    });
    
    // Toggle Jobdesk
    document.getElementById('toggleJobdesk')?.addEventListener('change', toggleJobdesk);
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = {
        kelas_id: document.getElementById('kelasSelect').value,
        identifier: document.getElementById('nisInput').value,
        password: document.getElementById('passwordInput').value
    };
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            currentKelas = formData.kelas_id;
            showDashboard();
            loadDashboardData();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Terjadi kesalahan. Silakan coba lagi.');
    }
}

// Show Dashboard
function showDashboard() {
    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('dashboardPage').classList.add('active');
    
    // Update UI
    document.getElementById('userInfo').textContent = 
        `${currentUser.nama_kelas} • ${currentUser.role === 'admin' ? 'Administrator' : 'Anggota'}`;
    document.getElementById('userMode').textContent = 
        `Mode: ${currentUser.role === 'admin' ? 'Admin' : 'Anggota'}`;
    document.getElementById('logoutText').textContent = 
        currentUser.role === 'admin' ? 'Keluar Admin' : 'Logout';
}

// Show Login
function showLogin() {
    document.getElementById('dashboardPage').classList.remove('active');
    document.getElementById('loginPage').classList.add('active');
    currentUser = null;
}

// Load Dashboard Data
async function loadDashboardData() {
    if (!currentKelas) return;
    
    await Promise.all([
        loadJadwalHarian(),
        loadJadwalMingguan(),
        loadStatistik(),
        loadSiswaList(),
        loadPermohonan(),
        loadDokumentasi()
    ]);
}

// Load Jadwal Harian
async function loadJadwalHarian() {
    try {
        const response = await fetch(`${API_URL}/jadwal/hari-ini/${currentKelas}`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('hariIniLabel').textContent = data.hari;
            
            const list = document.getElementById('petugasHariIni');
            list.innerHTML = '';
            
            data.data.forEach(petugas => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${petugas.nama_lengkap}</span>
                    <span class="status-badge">${petugas.posisi}</span>
                `;
                list.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Load jadwal harian error:', error);
    }
}

// Load Jadwal Mingguan
async function loadJadwalMingguan() {
    try {
        const response = await fetch(`${API_URL}/jadwal/mingguan/${currentKelas}`);
        const data = await response.json();
        
        if (data.success) {
            const container = document.getElementById('jadwalMingguan');
            container.innerHTML = '';
            
            const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
            
            hariList.forEach(hari => {
                const column = document.createElement('div');
                column.className = 'hari-column';
                column.innerHTML = `<h4>${hari}<br><small>${data.data[hari].length} Anak</small></h4>`;
                
                data.data[hari].forEach(siswa => {
                    const div = document.createElement('div');
                    div.className = `siswa-piket ${siswa.status || ''}`;
                    div.innerHTML = `
                        <strong>${siswa.nama_lengkap.substring(0, 15)}...</strong><br>
                        <small>${siswa.posisi}</small>
                    `;
                    column.appendChild(div);
                });
                
                container.appendChild(column);
            });
        }
    } catch (error) {
        console.error('Load jadwal mingguan error:', error);
    }
}

// Load Statistik
async function loadStatistik() {
    try {
        const response = await fetch(`${API_URL}/absensi/statistik/${currentKelas}`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalHadir').textContent = data.data.total_hadir || 0;
            document.getElementById('totalAlpha').textContent = data.data.total_alpha || 0;
        }
    } catch (error) {
        console.error('Load statistik error:', error);
    }
}

// Load Siswa List
async function loadSiswaList() {
    try {
        const response = await fetch(`${API_URL}/siswa/kelas/${currentKelas}`);
        const data = await response.json();
        
        if (data.success) {
            const list = document.getElementById('daftarSiswa');
            list.innerHTML = '';
            
            data.data.forEach(siswa => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div>
                        <strong>${siswa.nama_lengkap}</strong><br>
                        <small>NIS: ${siswa.nis}</small>
                    </div>
                    <span class="status-badge">Aktif</span>
                `;
                list.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Load siswa list error:', error);
    }
}

// Load Permohonan
async function loadPermohonan() {
    // Mock data for now
    const container = document.getElementById('daftarPermohonan');
    container.innerHTML = `
        <div class="permohonan-item">
            <div>
                <strong>#501</strong><br>
                <small>ANNISA NUR HADI (Senin) → FADLAN ABDILLAH (Selasa)</small>
            </div>
            <div class="permohonan-actions">
                <button class="btn-approve" onclick="approvePermohonan(501)">Setujui</button>
                <button class="btn-reject" onclick="rejectPermohonan(501)">Tolak</button>
            </div>
        </div>
    `;
}

// Load Dokumentasi
async function loadDokumentasi() {
    // Mock data for now
    const container = document.getElementById('galeriDokumentasi');
    container.innerHTML = `
        <div class="galeri-item">
            <img src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400" alt="Dokumentasi">
            <div class="galeri-info">
                <h4>ABDILLAH IMNI ISMAIL AL AMIN</h4>
                <p>"Pojok kiri kelas sudah disapu bersih dan rapi."</p>
                <small>2026-06-01</small>
            </div>
        </div>
    `;
}

// Modal Functions
function showModal(type) {
    document.getElementById(`modal${type.charAt(0).toUpperCase() + type.slice(1)}`).classList.add('active');
}

function closeModal(type) {
    document.getElementById(`modal${type.charAt(0).toUpperCase() + type.slice(1)}`).classList.remove('active');
}

// Toggle Jobdesk
function toggleJobdesk(e) {
    console.log('Toggle jobdesk:', e.target.checked);
}

// Approve Permohonan
function approvePermohonan(id) {
    alert(`Permohonan #${id} disetujui!`);
    loadPermohonan();
}

// Reject Permohonan
function rejectPermohonan(id) {
    alert(`Permohonan #${id} ditolak!`);
    loadPermohonan();
}

// Logout
async function logout() {
    try {
        await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
        currentUser = null;
        currentKelas = null;
        showLogin();
    } catch (error) {
        console.error('Logout error:', error);
        showLogin();
    }
}

// Form Submissions
document.getElementById('formTukarJadwal')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    alert('Permohonan tukar jadwal berhasil diajukan!');
    closeModal('ajukanTukar');
});

document.getElementById('formDokumentasi')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    alert('Dokumentasi berhasil diunggah!');
    closeModal('unggahDokumentasi');
    loadDokumentasi();
});

// Close modal on outside click
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}
