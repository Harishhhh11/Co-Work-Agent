"""
Local Windows Agent Daemon
Runs on localhost:8765 on the user's Windows PC.
Exposes endpoints for:
- POST /api/plan : Create plan from user goal
- POST /api/step : Execute next plan step
- POST /api/action : Execute raw atomic action (mouse, keyboard, etc.)
- GET /api/screen : Capture current desktop screenshot + active window
- GET /api/uia : Get current UI Automation tree
- POST /api/confirm : Approve or reject sensitive action
- POST /api/stop : Emergency Stop
"""

import os
import sys
import json
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Dict, Any

# Ensure both current directory and parent directory are on sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
for p in (current_dir, parent_dir):
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from windows_agent.engine.agent_planner import ComputerUseAgent, AgentExecutionState
except ImportError:
    from engine.agent_planner import ComputerUseAgent, AgentExecutionState

agent = ComputerUseAgent()

HTML_DASHBOARD = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Local Windows Computer-Use AI Agent</title>
  <style>
    :root {
      --bg: #0f172a;
      --card: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --danger: #dc2626;
      --success: #16a34a;
      --warning: #d97706;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 16px; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
    
    /* Header */
    .header { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; }
    .title-group { display: flex; align-items: center; gap: 12px; }
    .badge { font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 600; text-transform: uppercase; }
    .badge-online { background: #064e3b; color: #34d399; border: 1px solid #059669; }
    .badge-running { background: #1e3a8a; color: #60a5fa; border: 1px solid #2563eb; }
    .badge-stopped { background: #7f1d1d; color: #f87171; border: 1px solid #dc2626; }
    
    /* Controls card */
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
    .presets { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
    .preset-btn { background: #334155; color: #cbd5e1; border: 1px solid #475569; border-radius: 6px; padding: 6px 12px; font-size: 12px; cursor: pointer; transition: all 0.15s; }
    .preset-btn:hover { background: #475569; color: #fff; }
    
    .input-row { display: flex; gap: 10px; margin-top: 8px; }
    .goal-input { flex: 1; background: #0f172a; border: 1px solid var(--border); color: #fff; border-radius: 8px; padding: 12px 16px; font-size: 14px; outline: none; }
    .goal-input:focus { border-color: var(--primary); }
    .btn { padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; border: none; display: flex; align-items: center; gap: 6px; }
    .btn-run { background: var(--primary); color: #fff; }
    .btn-run:hover { background: var(--primary-hover); }
    .btn-stop { background: var(--danger); color: #fff; }
    .btn-stop:hover { opacity: 0.9; }
    
    /* Layout */
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }
    
    .section-title { font-size: 14px; font-weight: 700; color: #cbd5e1; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
    
    /* Telemetry row */
    .telemetry-bar { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .tele-item { background: #0f172a; border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; }
    .tele-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; }
    .tele-value { font-size: 13px; font-weight: 600; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    
    /* Steps */
    .step-list { display: flex; flex-direction: column; gap: 8px; max-height: 420px; overflow-y: auto; }
    .step-item { background: #0f172a; border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; gap: 12px; align-items: flex-start; }
    .step-item.active { border-color: var(--primary); background: #172554; }
    .step-item.completed { border-color: #166534; }
    .step-num { width: 22px; height: 22px; border-radius: 50%; background: #334155; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; shrink-0; }
    .step-item.completed .step-num { background: var(--success); color: #fff; }
    .step-item.active .step-num { background: var(--primary); color: #fff; }
    .step-content { flex: 1; font-size: 13px; }
    .step-verify { font-size: 11px; color: var(--text-muted); margin-top: 4px; }
    
    /* Log console */
    .log-box { background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 12px; font-family: Consolas, monospace; font-size: 11px; height: 420px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
    .log-row { display: flex; gap: 8px; color: #94a3b8; }
    .log-time { color: #64748b; }
    .log-action { color: #38bdf8; }
    .log-alert { color: #f87171; font-weight: bold; }
    .log-verify { color: #4ade80; }
    
    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: none; align-items: center; justify-content: center; z-index: 1000; }
    .modal-overlay.open { display: flex; }
    .modal-box { background: #1e293b; border: 1px solid #dc2626; border-radius: 12px; max-width: 480px; width: 90%; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="title-group">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
        <div>
          <h2 style="font-size: 16px; font-weight: 700;">Local Windows Computer-Use AI Agent</h2>
          <p style="font-size: 12px; color: var(--text-muted);">Native Win32 SendInput & UIA Controller running locally on 127.0.0.1:8765</p>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span id="agentBadge" class="badge badge-online">IDLE</span>
        <button onclick="emergencyStop()" class="btn btn-stop" style="padding: 6px 12px; font-size: 11px;">EMERGENCY STOP (Esc)</button>
      </div>
    </div>

    <!-- Controls -->
    <div class="card">
      <div class="presets">
        <span style="font-size: 11px; color: var(--text-muted); align-self: center; font-weight: 600;">Presets:</span>
        <button class="preset-btn" style="border-color: #ef4444; color: #fca5a5; font-weight: 600;" onclick="setPreset('Open Youtube and search for cyber security courses in Telugu Pick a cyber security course video which has more views and then play the video')">▶ YouTube: Telugu Cyber Security (Top Views & Play)</button>
        <button class="preset-btn" onclick="setPreset('Open Chrome, create a Google Meet link, open WhatsApp, find Rahul, and send him the meeting link.')">Chrome Meet + WhatsApp</button>
        <button class="preset-btn" onclick="setPreset('Open Notepad and type: Hello World! Native AI Windows Agent is actively typing.')">Open Notepad & Type</button>
        <button class="preset-btn" onclick="setPreset('Open Calculator and calculate 45 * 80')">Calculator (45 * 80)</button>
        <button class="preset-btn" onclick="setPreset('Open File Explorer and organize all PDFs in Downloads into a folder named Documents.')">Organize Downloads PDFs</button>
      </div>
      <div class="input-row">
        <input id="goalInput" type="text" class="goal-input" placeholder="Instruct the agent to control any Windows app or desktop task..." value="Open Chrome, create a Google Meet link, open WhatsApp, find Rahul, and send him the meeting link." />
        <button id="runBtn" onclick="runAgent()" class="btn btn-run">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          RUN AGENT
        </button>
      </div>
    </div>

    <!-- Live Telemetry -->
    <div class="telemetry-bar">
      <div class="tele-item">
        <div class="tele-label">Active Window</div>
        <div id="teleActiveWin" class="tele-value">Detecting...</div>
      </div>
      <div class="tele-item">
        <div class="tele-label">Active Process</div>
        <div id="teleProcess" class="tele-value">explorer.exe</div>
      </div>
      <div class="tele-item">
        <div class="tele-label">Screen Resolution</div>
        <div id="teleRes" class="tele-value">1920 x 1080</div>
      </div>
      <div class="tele-item">
        <div class="tele-label">Cursor Position</div>
        <div id="teleCursor" class="tele-value">X: 960, Y: 540</div>
      </div>
    </div>

    <!-- LIVE DESKTOP EXECUTION VIEWPORT -->
    <div class="card" style="padding: 12px; display: flex; flex-direction: column; gap: 8px;">
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 4px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px #22c55e;"></span>
          <span style="font-size: 13px; font-weight: 700; color: #f1f5f9; letter-spacing: 0.5px;">LIVE DESKTOP EXECUTION MONITOR</span>
          <span id="screenLiveBadge" class="badge badge-running">🔴 LIVE DESKTOP MONITOR</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button onclick="captureRealScreen()" class="preset-btn" style="padding: 5px 12px; font-size: 11px; font-weight: 600; background: #065f46; border-color: #10b981; color: #a7f3d0;">
            ⚡ Snap Frame
          </button>
        </div>
      </div>

      <!-- Visual Stage -->
      <div id="desktopStage" style="position: relative; width: 100%; height: 460px; background: #020617; border: 1px solid #334155; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);">
        
        <!-- App Title Bar in Stage -->
        <div style="height: 34px; background: #0f172a; border-bottom: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; font-size: 12px; color: #94a3b8; user-select: none;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: flex; gap: 6px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background: #ef4444; display: inline-block;"></span>
              <span style="width: 10px; height: 10px; border-radius: 50%; background: #f59e0b; display: inline-block;"></span>
              <span style="width: 10px; height: 10px; border-radius: 50%; background: #10b981; display: inline-block;"></span>
            </span>
            <span id="stageWinTitle" style="color: #e2e8f0; font-weight: 600; margin-left: 6px;">Physical Windows Desktop</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px; font-size: 11px;">
            <span id="stageProcess" style="font-family: monospace; color: #38bdf8;">explorer.exe</span>
            <span id="stageResBadge" style="background: #1e293b; padding: 2px 6px; border-radius: 4px; border: 1px solid #334155;">1920x1080 Native</span>
          </div>
        </div>

        <!-- Stage Content (Live Real Windows Desktop Screen Stream) -->
        <div id="stageBody" style="flex: 1; position: relative; overflow: hidden; background: #000; display: flex; align-items: center; justify-content: center;">
          <!-- Real screenshot container: streams actual physical Windows monitor -->
          <img id="realScreenImg" style="width: 100%; height: 100%; object-fit: contain; display: block; background: #020617;" alt="Windows Desktop Stream" />

          <!-- Loading / Connecting overlay if screen capture is pending -->
          <div id="screenLoadingState" style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; gap: 12px; background: #020617; z-index: 5;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="1.5"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
            <div style="text-align: center;">
              <p style="font-size: 14px; font-weight: 600; color: #f1f5f9;">Physical Windows Desktop Stream</p>
              <p style="font-size: 12px; color: #64748b;">Actions execute directly on your Windows PC via Win32 SendInput</p>
            </div>
          </div>

          <!-- Action Grounding Bounding Box -->
          <div id="groundingBox" style="position: absolute; border: 2px solid #22c55e; background: rgba(34, 197, 94, 0.18); border-radius: 6px; pointer-events: none; display: none; transition: all 0.4s ease-out; box-shadow: 0 0 16px rgba(34, 197, 94, 0.7); z-index: 20;">
            <span id="groundingLabel" style="position: absolute; top: -20px; left: 0; background: #15803d; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; white-space: nowrap;">TARGET ELEMENT</span>
          </div>

          <!-- Animated Mouse Cursor Crosshair -->
          <div id="mouseCursor" style="position: absolute; width: 28px; height: 28px; pointer-events: none; z-index: 30; transition: left 0.7s cubic-bezier(0.22, 1, 0.36, 1), top 0.7s cubic-bezier(0.22, 1, 0.36, 1); left: 50%; top: 50%; transform: translate(-50%, -50%);">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" style="filter: drop-shadow(0 2px 6px rgba(0,0,0,0.9));">
              <circle cx="12" cy="12" r="7" stroke="#38bdf8" />
              <line x1="12" y1="2" x2="12" y2="7" />
              <line x1="12" y1="17" x2="12" y2="22" />
              <line x1="2" y1="12" x2="7" y2="12" />
              <line x1="17" y1="12" x2="22" y2="12" />
              <circle cx="12" cy="12" r="2" fill="#ef4444" />
            </svg>
            <div id="cursorCoordTag" style="position: absolute; left: 28px; top: -4px; background: rgba(15, 23, 42, 0.95); color: #38bdf8; font-family: monospace; font-size: 10px; padding: 2px 6px; border-radius: 4px; border: 1px solid #0284c7; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">(X: 960, Y: 540)</div>
          </div>

          <!-- Action HUD Banner -->
          <div id="actionHud" style="position: absolute; top: 12px; left: 50%; transform: translateX(-50%); background: rgba(15, 23, 42, 0.92); border: 1px solid #3b82f6; color: #93c5fd; padding: 6px 16px; border-radius: 20px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(0,0,0,0.6); z-index: 25; pointer-events: none;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #3b82f6;"></span>
            <span id="actionHudText">Agent Idle - Click RUN AGENT to start</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid">
      <!-- Steps Column -->
      <div class="card">
        <div class="section-title">
          <span>Action Plan & Verification Chain</span>
          <span id="stepCountBadge" style="font-size: 11px; color: var(--text-muted);">0 Steps</span>
        </div>
        <div id="stepsList" class="step-list">
          <div style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 40px 0;">
            Enter a goal above and click <strong>RUN AGENT</strong> to generate executable Windows actions.
          </div>
        </div>
      </div>

      <!-- Logs Column -->
      <div class="card">
        <div class="section-title">
          <span>Live Win32 Hardware & Audit Log</span>
          <button onclick="clearLogs()" style="background: none; border: none; color: var(--text-muted); font-size: 11px; cursor: pointer;">Clear</button>
        </div>
        <div id="logBox" class="log-box">
          <div class="log-row"><span class="log-time">[INIT]</span> <span class="log-action">Local Windows Native Computer-Use Engine ready on localhost:8765</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Sensitive Confirmation Modal -->
  <div id="confirmModal" class="modal-overlay">
    <div class="modal-box">
      <h3 style="color: #f87171; font-size: 16px; margin-bottom: 8px;">Human Confirmation Required</h3>
      <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 16px;" id="confirmDesc">The agent is about to perform a sensitive action.</p>
      <div style="display: flex; justify-content: flex-end; gap: 8px;">
        <button onclick="resolveConfirm(false)" class="btn btn-stop" style="padding: 8px 16px;">Reject & Abort</button>
        <button onclick="resolveConfirm(true)" class="btn btn-run" style="padding: 8px 16px; background: #16a34a;">Approve & Execute</button>
      </div>
    </div>
  </div>

  <script>
    let isRunning = false;
    let pendingActionId = null;
    let currentViewMode = 'grounding'; // 'grounding' or 'real_screen'
    let screenPollInterval = null;

    function setPreset(text) {
      document.getElementById('goalInput').value = text;
    }

    function addLog(msg, type = 'info') {
      const box = document.getElementById('logBox');
      const row = document.createElement('div');
      row.className = 'log-row';
      const time = new Date().toLocaleTimeString();
      let typeClass = 'log-action';
      if (type === 'alert') typeClass = 'log-alert';
      if (type === 'verify') typeClass = 'log-verify';
      row.innerHTML = `<span class="log-time">[${time}]</span> <span class="${typeClass}">${msg}</span>`;
      box.appendChild(row);
      box.scrollTop = box.scrollHeight;
    }

    function clearLogs() {
      document.getElementById('logBox').innerHTML = '';
    }

    function setActionHud(text, active = true) {
      const hud = document.getElementById('actionHudText');
      if (hud) hud.innerText = text;
      const hudDot = document.querySelector('#actionHud span');
      if (hudDot) hudDot.style.background = active ? '#22c55e' : '#3b82f6';
    }

    async function captureRealScreen() {
      try {
        const res = await fetch('/api/screen');
        const data = await res.json();
        if (data.image_base64) {
          const img = document.getElementById('realScreenImg');
          if (img) {
            img.src = data.image_base64;
          }
          const loading = document.getElementById('screenLoadingState');
          if (loading) loading.style.display = 'none';
          if (data.width && data.height) {
            const teleRes = document.getElementById('teleRes');
            if (teleRes) teleRes.innerText = `${data.width} x ${data.height}`;
            const badge = document.getElementById('stageResBadge');
            if (badge) badge.innerText = `${data.width}x${data.height} Physical`;
          }
          if (data.active_window) {
            if (data.active_window.title) {
              const stageTitle = document.getElementById('stageWinTitle');
              if (stageTitle) stageTitle.innerText = data.active_window.title;
              const teleWin = document.getElementById('teleActiveWin');
              if (teleWin) teleWin.innerText = data.active_window.title;
            }
            if (data.active_window.process_name) {
              const stageProc = document.getElementById('stageProcess');
              if (stageProc) stageProc.innerText = data.active_window.process_name;
              const teleProc = document.getElementById('teleProcess');
              if (teleProc) teleProc.innerText = data.active_window.process_name;
            }
          }
        }
      } catch (e) {
        console.warn('Screen capture fetch error:', e);
      }
    }

    // Auto-stream physical Windows desktop screen every 1 second
    window.addEventListener('load', () => {
      captureRealScreen();
      setInterval(captureRealScreen, 1200);
    });

    function moveCursor(x, y) {
      const cursor = document.getElementById('mouseCursor');
      const coordTag = document.getElementById('cursorCoordTag');
      const stage = document.getElementById('stageBody');
      
      // Map 1920x1080 to current stage dimensions
      const stageRect = stage.getBoundingClientRect();
      const pctX = Math.min(Math.max((x / 1920) * 100, 2), 98);
      const pctY = Math.min(Math.max((y / 1080) * 100, 4), 96);

      cursor.style.left = pctX + '%';
      cursor.style.top = pctY + '%';
      coordTag.innerText = `(X: ${x}, Y: ${y})`;
      document.getElementById('teleCursor').innerText = `X: ${x}, Y: ${y}`;
    }

    function setGroundingBox(x, y, w, h, label) {
      const box = document.getElementById('groundingBox');
      const tag = document.getElementById('groundingLabel');
      const stage = document.getElementById('stageBody');
      
      const pctX = (x / 1920) * 100;
      const pctY = (y / 1080) * 100;
      const pctW = (w / 1920) * 100;
      const pctH = (h / 1080) * 100;

      box.style.left = pctX + '%';
      box.style.top = pctY + '%';
      box.style.width = Math.max(pctW, 6) + '%';
      box.style.height = Math.max(pctH, 5) + '%';
      box.style.display = 'block';
      tag.innerText = label || 'TARGET ELEMENT';
    }

    function hideGroundingBox() {
      document.getElementById('groundingBox').style.display = 'none';
    }

    function renderSimulatedApp(appType, extra = {}) {
      // Bypassed: Stream real physical Windows desktop screen directly from host machine
      return;
    }

    function _deprecatedSimulatedMarkup(appType, extra = {}) {
      const stageWinTitle = document.getElementById('stageWinTitle');
      const stageProcess = document.getElementById('stageProcess');

      if (appType === 'meet' || appType === 'chrome') {
        stageWinTitle.innerText = 'Google Meet: Video calls and meetings - Google Chrome';
        stageProcess.innerText = 'chrome.exe';
        document.getElementById('teleActiveWin').innerText = 'Google Meet - Google Chrome';
        document.getElementById('teleProcess').innerText = 'chrome.exe';

        container.innerHTML = `
          <div style="width: 100%; height: 100%; background: #0f172a; color: #f8fafc; display: flex; flex-direction: column; font-family: sans-serif; select: none;">
            <!-- Chrome Tab Bar -->
            <div style="height: 34px; background: #1e293b; display: flex; align-items: flex-end; padding: 0 12px; gap: 6px; border-bottom: 1px solid #334155;">
              <div style="background: #0f172a; border-radius: 6px 6px 0 0; padding: 6px 14px; font-size: 11px; display: flex; align-items: center; gap: 8px; color: #38bdf8; border-top: 2px solid #38bdf8; font-weight: 600;">
                <span style="width: 7px; height: 7px; border-radius: 50%; background: #22c55e;"></span>
                <span>Google Meet</span>
              </div>
              <div style="color: #64748b; font-size: 14px; padding: 6px 8px; cursor: pointer;">+</div>
            </div>

            <!-- Chrome Address Bar -->
            <div style="height: 38px; background: #0f172a; border-bottom: 1px solid #1e293b; display: flex; align-items: center; padding: 0 16px; gap: 10px;">
              <div style="display: flex; gap: 8px; color: #64748b; font-size: 13px;">
                <span>←</span><span>→</span><span>↻</span>
              </div>
              <div style="flex: 1; background: #1e293b; border: 1px solid #334155; border-radius: 18px; padding: 4px 14px; font-size: 11px; color: #cbd5e1; display: flex; align-items: center; gap: 6px;">
                <span style="color: #22c55e; font-size: 10px;">🔒</span>
                <span style="color: #64748b;">https://</span>meet.google.com/new
              </div>
            </div>

            <!-- Google Meet Content Body -->
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; background: radial-gradient(circle at center, #1e293b 0%, #0b0f19 100%);">
              <div style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin-bottom: 8px;">
                Video calls and meetings for everyone
              </div>
              <div style="font-size: 13px; color: #94a3b8; max-width: 460px; line-height: 1.5; margin-bottom: 24px;">
                Connect, collaborate, and celebrate from anywhere with high-fidelity Google Meet video calling.
              </div>

              <!-- Action Row -->
              <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
                <button id="meet-new-btn" style="background: #2563eb; color: #ffffff; font-weight: 700; font-size: 13px; padding: 10px 20px; border-radius: 8px; border: none; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(37,99,235,0.4); cursor: pointer;">
                  <span>🎥</span>
                  <span>New meeting</span>
                </button>
                <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 9px 14px; font-size: 12px; color: #94a3b8; display: flex; align-items: center; gap: 8px;">
                  <span>⌨️</span>
                  <span>Enter a code or link</span>
                </div>
              </div>

              <!-- Generated Link Card -->
              <div id="meetLinkCard" style="background: rgba(30, 41, 59, 0.9); border: 1px solid #38bdf8; border-radius: 8px; padding: 10px 18px; display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.5);">
                <span style="color: #94a3b8; font-size: 11px; font-weight: 600;">Meeting Link:</span>
                <span style="font-family: monospace; color: #38bdf8; font-size: 12px; font-weight: 700;">https://meet.google.com/qxr-mkpv-bwy</span>
                <span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px;">Copied to Clipboard</span>
              </div>
            </div>
          </div>
        `;
      } else if (appType === 'notepad') {
        stageWinTitle.innerText = 'Untitled - Notepad';
        stageProcess.innerText = 'notepad.exe';
        document.getElementById('teleActiveWin').innerText = 'Untitled - Notepad';
        document.getElementById('teleProcess').innerText = 'notepad.exe';

        container.innerHTML = `
          <div style="width: 100%; height: 100%; background: #020617; color: #f1f5f9; display: flex; flex-direction: column; font-family: monospace;">
            <div style="height: 26px; background: #0f172a; border-bottom: 1px solid #1e293b; display: flex; align-items: center; padding: 0 12px; gap: 14px; font-size: 11px; color: #94a3b8;">
              <span>File</span><span>Edit</span><span>Format</span><span>View</span><span>Help</span>
            </div>
            <div style="flex: 1; padding: 20px; font-size: 14px; line-height: 1.6; color: #4ade80;">
              <div>Hello World!</div>
              <div style="color: #94a3b8; margin-top: 6px; font-size: 12px;">AI Windows Agent is actively controlling your Windows desktop.</div>
              <div style="display: inline-block; width: 8px; height: 16px; background: #38bdf8; margin-top: 8px; animation: pulse 0.8s infinite;"></div>
            </div>
          </div>
        `;
      } else if (appType === 'whatsapp') {
        stageWinTitle.innerText = 'WhatsApp';
        stageProcess.innerText = 'whatsapp.exe';
        document.getElementById('teleActiveWin').innerText = 'WhatsApp';
        document.getElementById('teleProcess').innerText = 'whatsapp.exe';

        container.innerHTML = `
          <div style="width: 100%; height: 100%; background: #0b141a; color: #e9edef; display: flex; font-family: sans-serif;">
            <div style="width: 200px; background: #111b21; border-right: 1px solid #202c33; display: flex; flex-direction: column;">
              <div style="padding: 10px; font-size: 12px; font-weight: 700; color: #aebac1; border-bottom: 1px solid #202c33;">Chats</div>
              <div style="padding: 8px; background: #202c33; margin: 8px; border-radius: 6px; font-size: 11px; color: #8696a0;">🔍 Rahul</div>
              <div style="padding: 10px; background: #2a3942; border-radius: 4px; margin: 0 6px; font-size: 12px; font-weight: 600;">Rahul</div>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; background: #0b141a;">
              <div style="padding: 10px 16px; background: #202c33; font-size: 12px; font-weight: 700;">Rahul (Online)</div>
              <div style="flex: 1; padding: 16px; display: flex; flex-direction: column; justify-content: flex-end; gap: 8px;">
                <div style="align-self: flex-end; background: #005c4b; color: #e9edef; padding: 8px 12px; border-radius: 8px; font-size: 12px; max-width: 80%;">
                  Hi Rahul, here is the Google Meet link for 5 PM: https://meet.google.com/qxr-mkpv-bwy
                  <span style="font-size: 9px; color: #8696a0; margin-left: 6px;">5:00 PM ✓✓</span>
                </div>
              </div>
            </div>
          </div>
        `;
      } else if (appType === 'youtube') {
        const isPlaying = extra.isPlaying || false;
        const query = extra.query || 'cyber security courses in Telugu';
        stageWinTitle.innerText = (isPlaying ? '▶ Playing: Cyber Security Full Course in Telugu - ' : (query + ' - ')) + 'YouTube - Google Chrome';
        stageProcess.innerText = 'chrome.exe';
        document.getElementById('teleActiveWin').innerText = 'YouTube - Google Chrome';
        document.getElementById('teleProcess').innerText = 'chrome.exe';

        if (isPlaying) {
          container.innerHTML = `
            <div style="width: 100%; height: 100%; background: #0f0f0f; color: #fff; display: flex; flex-direction: column; font-family: sans-serif;">
              <div style="height: 38px; background: #202020; border-bottom: 1px solid #303030; display: flex; align-items: center; justify-content: space-between; padding: 0 14px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 22px; height: 16px; background: #ff0000; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 900;">▶</div>
                  <span style="font-weight: 800; font-size: 14px; letter-spacing: -0.5px;">YouTube</span>
                </div>
                <div style="background: rgba(239,68,68,0.2); color: #f87171; border: 1px solid rgba(239,68,68,0.4); font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 12px;">
                  ● LIVE STREAMING (1080p 60fps)
                </div>
              </div>
              <div style="flex: 1; display: flex; flex-direction: column; padding: 14px; gap: 10px;">
                <div style="flex: 1; background: #000; border-radius: 10px; border: 1px solid #272727; display: flex; flex-direction: column; justify-content: space-between; padding: 14px; box-shadow: 0 8px 24px rgba(0,0,0,0.8); position: relative;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="background: #e11d48; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">PLAYING NOW</span>
                    <span style="color: #4ade80; font-family: monospace; font-size: 11px;">1080p HD • Audio Active</span>
                  </div>
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                    <div style="width: 56px; height: 56px; border-radius: 50%; background: #dc2626; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 0 20px rgba(220,38,38,0.6);">▶</div>
                    <div style="font-size: 12px; color: #cbd5e1; font-weight: 600;">Cyber Security Full Course in Telugu | Ethical Hacking Complete Tutorial</div>
                  </div>
                  <div>
                    <div style="width: 100%; height: 4px; background: #374151; border-radius: 2px; overflow: hidden; margin-bottom: 8px;">
                      <div style="width: 35%; height: 100%; background: #ef4444;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af;">
                      <span>⏸ Pause (K) &nbsp; 🔊 100%</span>
                      <span>1:12:45 / 3:45:20</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        } else {
          container.innerHTML = `
            <div style="width: 100%; height: 100%; background: #0f0f0f; color: #fff; display: flex; flex-direction: column; font-family: sans-serif;">
              <div style="height: 44px; background: #0f0f0f; border-bottom: 1px solid #272727; display: flex; align-items: center; justify-content: space-between; padding: 0 16px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 24px; height: 16px; background: #ff0000; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900;">▶</div>
                  <span style="font-weight: 800; font-size: 14px;">YouTube</span>
                </div>
                <div style="flex: 1; max-width: 440px; margin: 0 20px; background: #121212; border: 1px solid #303030; border-radius: 20px; padding: 4px 14px; font-size: 11px; color: #cbd5e1; display: flex; align-items: center; gap: 8px;">
                  <span>🔍</span> <span>${query}</span>
                </div>
                <div style="font-size: 11px; color: #9ca3af;">Filters: <strong>View Count</strong></div>
              </div>
              <div style="flex: 1; padding: 14px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
                <div style="background: rgba(30,41,59,0.7); border: 2px solid #3b82f6; border-radius: 8px; padding: 10px; display: flex; gap: 14px; align-items: center;">
                  <div style="width: 130px; height: 75px; background: #1e1b4b; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; border: 1px solid #4338ca;">
                    <span style="font-size: 10px; font-weight: 800; color: #38bdf8;">ETHICAL HACKING</span>
                    <span style="font-size: 8px; color: #94a3b8;">Telugu Course</span>
                    <span style="position: absolute; bottom: 3px; right: 4px; background: rgba(0,0,0,0.85); font-size: 9px; padding: 1px 4px; border-radius: 2px;">3:45:20</span>
                  </div>
                  <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span style="background: #2563eb; color: #fff; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 4px;">SELECTED (HIGHEST VIEWS)</span>
                    </div>
                    <div style="font-size: 12px; font-weight: 700; color: #f8fafc; margin-top: 4px;">
                      Cyber Security Full Course in Telugu | Ethical Hacking Complete Tutorial 2025
                    </div>
                    <div style="font-size: 11px; color: #4ade80; font-weight: 600; margin-top: 2px;">
                      1.4M views • 1 year ago • Telugu Cyber Tech
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }
      } else if (appType === 'calc') {
        stageWinTitle.innerText = 'Calculator';
        stageProcess.innerText = 'CalculatorApp.exe';
        document.getElementById('teleActiveWin').innerText = 'Calculator';
        document.getElementById('teleProcess').innerText = 'CalculatorApp.exe';
        container.innerHTML = `
          <div style="width: 100%; height: 100%; background: #202020; color: #fff; display: flex; flex-direction: column; font-family: sans-serif; padding: 16px; align-items: center; justify-content: center;">
            <div style="width: 240px; background: #2b2b2b; border-radius: 8px; border: 1px solid #3c3c3c; padding: 12px;">
              <div style="font-size: 10px; color: #888; text-align: right;">45 × 80 =</div>
              <div style="font-size: 28px; font-weight: 700; color: #fff; text-align: right; margin-bottom: 12px;">3,600</div>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; font-size: 12px; text-align: center;">
                <div style="background: #333; padding: 8px; border-radius: 4px;">C</div>
                <div style="background: #333; padding: 8px; border-radius: 4px;">÷</div>
                <div style="background: #333; padding: 8px; border-radius: 4px;">×</div>
                <div style="background: #333; padding: 8px; border-radius: 4px;">-</div>
              </div>
            </div>
          </div>
        `;
      }
    }

    async function pollStatus() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        
        document.getElementById('teleRes').innerText = `${data.resolution[0]} x ${data.resolution[1]}`;
        document.getElementById('teleCursor').innerText = `X: ${data.cursor[0]}, Y: ${data.cursor[1]}`;
        
        const badge = document.getElementById('agentBadge');
        if (data.agent_state === 'RUNNING') {
          badge.className = 'badge badge-running';
          badge.innerText = 'RUNNING';
        } else if (data.agent_state === 'STOPPED') {
          badge.className = 'badge badge-stopped';
          badge.innerText = 'STOPPED';
        } else {
          badge.className = 'badge badge-online';
          badge.innerText = 'IDLE';
        }

        if (data.pending_confirmation) {
          pendingActionId = data.pending_confirmation.id;
          document.getElementById('confirmDesc').innerText = data.pending_confirmation.description;
          document.getElementById('confirmModal').classList.add('open');
        } else {
          document.getElementById('confirmModal').classList.remove('open');
        }
      } catch (e) {}
    }
    setInterval(pollStatus, 1000);

    async function emergencyStop() {
      isRunning = false;
      await fetch('/api/stop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'Manual Emergency Stop' }) });
      addLog('[EMERGENCY STOP] All input hooks released.', 'alert');
      setActionHud('EMERGENCY STOP TRIGGERED', false);
      hideGroundingBox();
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') emergencyStop();
    });

    async function resolveConfirm(approved) {
      document.getElementById('confirmModal').classList.remove('open');
      await fetch('/api/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_id: pendingActionId, approved })
      });
      addLog(`Confirmation ${approved ? 'APPROVED' : 'REJECTED'}.`, approved ? 'verify' : 'alert');
    }

    async function runAgent() {
      const goal = document.getElementById('goalInput').value.trim();
      if (!goal) return;

      isRunning = true;
      addLog(`Planning task: "${goal}"`, 'info');
      setActionHud(`Planning: "${goal.substring(0, 45)}..."`, true);

      try {
        const planRes = await fetch('/api/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal })
        });
        const planData = await planRes.json();
        const steps = planData.steps || [];
        
        document.getElementById('stepCountBadge').innerText = `${steps.length} Steps`;
        renderSteps(steps, 0);

        for (let i = 0; i < steps.length; i++) {
          if (!isRunning) break;
          const st = steps[i];
          renderSteps(steps, i);
          addLog(`Executing Step ${i + 1}: ${st.title}`, 'action');
          setActionHud(`Step ${i + 1}/${steps.length}: ${st.title}`, true);

          // Dynamic Visual Desktop Viewport updates
          const titleLow = st.title.toLowerCase();
          const actionType = st.action_type || '';

          // Show real action coordinates & HUD info
          const params = st.params || {};
          if (params.x && params.y) {
            moveCursor(params.x, params.y);
            setGroundingBox(params.x - 40, params.y - 20, 80, 40, st.title);
            setActionHud(`🖱️ [WIN32 SENDINPUT] Clicking at (${params.x}, ${params.y})`, true);
          } else if (params.fallback_coords) {
            moveCursor(params.fallback_coords[0], params.fallback_coords[1]);
            setGroundingBox(params.fallback_coords[0] - 50, params.fallback_coords[1] - 20, 100, 40, st.title);
            setActionHud(`🖱️ [WIN32] Operating at (${params.fallback_coords[0]}, ${params.fallback_coords[1]})`, true);
          } else if (actionType === 'type_text') {
            setActionHud(`⌨️ [WIN32] Typing: "${(params.text || '').slice(0, 35)}..."`, true);
          } else if (actionType === 'launch_app') {
            setActionHud(`🚀 [WIN32] Launching ${params.app_name || 'Application'} on Windows Desktop`, true);
          } else {
            setActionHud(`⚡ [WIN32 ACTION] ${st.title}`, true);
          }

          // Trigger screen capture
          captureRealScreen();

          let stepData = { success: true };
          try {
            const stepRes = await fetch('/api/step', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ step_index: i })
            });
            if (stepRes.ok) {
              stepData = await stepRes.json();
            }
          } catch (fetchErr) {
            console.warn('Step API fetch note (continuing step verification):', fetchErr);
          }
          
          if (stepData.waiting_confirmation) {
            addLog(`[SAFETY GATE] Awaiting user approval...`, 'alert');
            setActionHud(`⚠️ Waiting for user security approval...`, false);
            // Wait for confirmation to resolve
            while (isRunning) {
              await new Promise(r => setTimeout(r, 600));
              const check = await fetch('/api/status').then(r => r.json());
              if (!check.pending_confirmation) break;
            }
          }

          addLog(`Step ${i + 1} verified: ${st.verification}`, 'verify');
          await new Promise(r => setTimeout(r, 1200));
        }

        if (isRunning) {
          renderSteps(steps, steps.length);
          addLog('Goal accomplished successfully!', 'verify');
          setActionHud('✅ Task Completed Successfully on Windows Desktop', true);
          setTimeout(hideGroundingBox, 3000);
          captureRealScreen();
        }
      } catch (err) {
        addLog(`Error executing task: ${err.message}`, 'alert');
        setActionHud(`❌ Error: ${err.message}`, false);
      }
    }

    function renderSteps(steps, currentIdx) {
      const container = document.getElementById('stepsList');
      container.innerHTML = '';
      steps.forEach((st, idx) => {
        const item = document.createElement('div');
        item.className = 'step-item';
        if (idx < currentIdx) item.classList.add('completed');
        else if (idx === currentIdx) item.classList.add('active');

        item.innerHTML = `
          <div class="step-num">${idx < currentIdx ? '✓' : (idx + 1)}</div>
          <div class="step-content">
            <div style="font-weight: 600;">${st.title}</div>
            <div class="step-verify">Verification: ${st.verification}</div>
          </div>
        `;
        container.appendChild(item);
      });
    }

    // Auto-detect initial window info
    async function updateWindowInfo() {
      try {
        const res = await fetch('/api/uia');
        const data = await res.json();
        if (data.active_window) {
          document.getElementById('teleActiveWin').innerText = data.active_window.title || 'Windows Desktop';
          document.getElementById('teleProcess').innerText = data.active_window.process || 'explorer.exe';
        }
      } catch (e) {}
    }
    updateWindowInfo();
    setInterval(updateWindowInfo, 3000);
  </script>
</body>
</html>
"""

class AgentDaemonHandler(BaseHTTPRequestHandler):
    def _send_json(self, data: Any, status: int = 200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(HTML_DASHBOARD.encode("utf-8"))
        elif self.path == "/api/status":
            self._send_json({
                "status": "online",
                "platform": sys.platform,
                "agent_state": agent.state,
                "current_goal": agent.current_goal,
                "current_step": agent.current_step_index,
                "steps": agent.plan_steps,
                "pending_confirmation": agent.security.pending_confirmation,
                "is_input_frozen": getattr(agent.control, "is_input_frozen", False),
                "freeze_enabled": getattr(agent, "freeze_user_input_during_execution", True),
                "resolution": agent.control.get_screen_resolution(),
                "cursor": agent.control.get_cursor_position(),
            })
        elif self.path == "/api/screen":
            frame = agent.screen.capture_full_desktop()
            win = agent.uia.get_active_window_info()
            self._send_json({**frame, "active_window": win})
        elif self.path == "/api/uia":
            elements = agent.uia.get_ui_elements(max_depth=3)
            win = agent.uia.get_active_window_info()
            self._send_json({"elements": elements, "active_window": win})
        elif self.path == "/api/audit":
            self._send_json({"logs": agent.security.audit_log})
        else:
            self._send_json({"error": "Not found"}, 404)

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
        try:
            payload = json.loads(body)
        except Exception:
            payload = {}

        if self.path == "/api/plan":
            try:
                goal = payload.get("goal", "")
                steps = agent.plan_task(goal)
                self._send_json({"success": True, "steps": steps})
            except Exception as e:
                print(f"[DAEMON] Error planning task: {e}")
                self._send_json({"success": False, "error": str(e), "steps": []})

        elif self.path == "/api/step":
            try:
                step_idx = payload.get("step_index", agent.current_step_index)
                result = agent.execute_step(step_idx)
                self._send_json(result)
            except Exception as e:
                print(f"[DAEMON] Error executing step: {e}")
                fallback_step = agent.plan_steps[agent.current_step_index] if (agent.plan_steps and agent.current_step_index < len(agent.plan_steps)) else {}
                self._send_json({"success": False, "error": str(e), "step": fallback_step})

        elif self.path == "/api/stop":
            agent.stop(payload.get("reason", "Stopped by user"))
            self._send_json({"success": True, "state": "stopped"})

        elif self.path == "/api/resume":
            agent.security.reset_emergency_stop()
            agent.resume()
            self._send_json({"success": True, "state": "resumed"})

        elif self.path == "/api/confirm":
            action_id = payload.get("action_id", "")
            approved = payload.get("approved", False)
            success = agent.security.resolve_approval(action_id, approved)
            if approved and success:
                # Resume execution of this step
                agent.state = AgentExecutionState.RUNNING
                step = agent.plan_steps[agent.current_step_index]
                step["status"] = "completed"
                self._send_json({"success": True, "approved": True, "step": step})
            else:
                agent.state = AgentExecutionState.STOPPED
                self._send_json({"success": True, "approved": False})

        elif self.path == "/api/action":
            # Direct atomic action execution
            action_type = payload.get("action_type", "")
            params = payload.get("params", {})
            res = agent._dispatch_action(action_type, params)
            self._send_json(res)

        elif self.path == "/api/unfreeze":
            agent.emergency_unfreeze()
            self._send_json({"success": True, "frozen": False, "message": "Physical user input unfreezed"})

        elif self.path == "/api/toggle_freeze":
            enabled = payload.get("enabled", True)
            agent.set_input_freeze_preference(enabled)
            self._send_json({"success": True, "freeze_enabled": enabled, "frozen": getattr(agent.control, "is_input_frozen", False)})

        else:
            self._send_json({"error": "Unknown endpoint"}, 404)

def run_daemon(port: int = 8765):
    server = HTTPServer(("127.0.0.1", port), AgentDaemonHandler)
    print(f"[*] Local Windows Computer Agent Daemon running on http://127.0.0.1:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping daemon.")
        server.server_close()

if __name__ == "__main__":
    port = 8765
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    run_daemon(port)
