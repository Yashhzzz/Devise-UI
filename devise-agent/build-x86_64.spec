# -*- mode: python ; coding: utf-8 -*-
# Build spec for x86_64 (Intel/AMD 64-bit) architecture

block_cipher = None

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('data/ai_tools_registry.json', 'data'),
        ('data/binary_hash.txt', 'data'),
        ('installers/linux', 'installers/linux'),
    ],
    hiddenimports=[
        'psutil',
        'dnspython',
        'httpx',
        'APScheduler',
        'keyring',
        'keyring.backends',
        'keyring.backends.SecretService',
        'keyring.backends.Windows',
        'keyring.backends.macOS',
        'pysqlcipher3',
        'doh_resolver',
        'frequency_tracker',
        'tamper_guard',
        'liveness_monitor',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='devise-agent',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch='x86_64',
    codesign_identity=None,
    entitlements_file=None,
)
