
export const PRESETS = {
  light: {
    label: 'Pure White',
    background_color: '#FFFFFF',
    text_color: '#14181F',
    button_color: '#1769FF',
    button_style: 'rounded',
    font_family: 'sans',
    layout_style: 'card',
    profile_image_shape: 'circle',
    link_card_style: 'filled',
  },

  dark: {
    label: 'Midnight',
    background_color: '#14181F',
    text_color: '#F4F7FA',
    button_color: '#00AFA0',
    button_style: 'rounded',
    font_family: 'sans',
    layout_style: 'card',
    profile_image_shape: 'circle',
    link_card_style: 'filled',
  },

  minimal: {
    label: 'Minimal White',
    background_color: '#FFFFFF',
    text_color: '#222B35',
    button_color: '#1769FF',
    button_style: 'square',
    font_family: 'sans',
    layout_style: 'flat',
    profile_image_shape: 'square',
    link_card_style: 'outline',
  },

  professional: {
    label: 'Ocean Professional',
    background_color: '#F4F7FA',
    text_color: '#142B45',
    button_color: '#087F8C',
    button_style: 'rounded',
    font_family: 'serif',
    layout_style: 'card',
    profile_image_shape: 'rounded',
    link_card_style: 'shadow',
  },

  gradient: {
    label: 'Electric Blue',
    background_color: '#1769FF',
    text_color: '#FFFFFF',
    button_color: '#FFFFFF',
    button_style: 'pill',
    font_family: 'sans',
    layout_style: 'glass',
    profile_image_shape: 'circle',
    link_card_style: 'filled',
  },

  creative: {
    label: 'Amber Creative',
    background_color: '#FFF9ED',
    text_color: '#263238',
    button_color: '#F5A623',
    button_style: 'pill',
    font_family: 'display',
    layout_style: 'card',
    profile_image_shape: 'rounded',
    link_card_style: 'shadow',
  },
};

export const THEME_KEYS = [
  'preset',
  'background_color',
  'text_color',
  'button_color',
  'button_style',
  'font_family',
  'layout_style',
  'profile_image_shape',
  'link_card_style',
];

export const pickTheme = (t) =>
  Object.fromEntries(THEME_KEYS.map((k) => [k, t[k]]));

export const fromPreset = (name) => ({
  preset: name,
  ...Object.fromEntries(
    Object.entries(PRESETS[name]).filter(([k]) => k !== 'label')
  ),
});

export const DEFAULT_THEME = fromPreset('light');
