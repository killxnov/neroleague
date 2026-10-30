export const formatTime = (seconds: number) => {
  if (!seconds) return '00:00';
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export const ROLE_ICONS: Record<string, string> = {
  UNSELECTED: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-unselected.png',
  TOP: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-top.png',
  JUNGLE: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-jungle.png',
  MIDDLE: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-middle.png',
  BOTTOM: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-bottom.png',
  UTILITY: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-utility.png',
  FILL: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-fill.png'
};

export const ROLE_NAMES: Record<string, string> = {
  UNSELECTED: 'SELECIONAR', TOP: 'TOP', JUNGLE: 'JUNGLE', MIDDLE: 'MID', BOTTOM: 'ADC', UTILITY: 'SUPP', FILL: 'FILL'
};

export const STAT_SHARDS = [
  [{ id: 5008, icon: 'StatMods/StatModsAdaptiveForceIcon.png' }, { id: 5005, icon: 'StatMods/StatModsAttackSpeedIcon.png' }, { id: 5007, icon: 'StatMods/StatModsCDRIcon.png' }],
  [{ id: 5008, icon: 'StatMods/StatModsAdaptiveForceIcon.png' }, { id: 5010, icon: 'StatMods/StatModsMovementSpeedIcon.png' }, { id: 5011, icon: 'StatMods/StatModsHealthScalingIcon.png' }],
  [{ id: 5011, icon: 'StatMods/StatModsHealthScalingIcon.png' }, { id: 5013, icon: 'StatMods/StatModsTenacityIcon.png' }, { id: 5001, icon: 'StatMods/StatModsHealthPlusIcon.png' }]
];