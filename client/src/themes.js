// Preset values must stay within the options the API accepts (see server/src/routes/themes.js).
export const PRESETS = {
  light:        { label: 'Light',        background_color: '#ffffff', text_color: '#14181f', button_color: '#3347ff', button_style: 'rounded', font_family: 'sans',    layout_style: 'card', profile_image_shape: 'circle',  link_card_style: 'filled' },
  dark:         { label: 'Dark',         background_color: '#0f1117', text_color: '#f1f3f8', button_color: '#7c8bff', button_style: 'rounded', font_family: 'sans',    layout_style: 'card', profile_image_shape: 'circle',  link_card_style: 'filled' },
  minimal:      { label: 'Minimal',      background_color: '#fafafa', text_color: '#222222', button_color: '#222222', button_style: 'square',  font_family: 'sans',    layout_style: 'flat', profile_image_shape: 'square',  link_card_style: 'outline' },
  professional: { label: 'Professional', background_color: '#eef1f6', text_color: '#1b2a41', button_color: '#1f3a68', button_style: 'rounded', font_family: 'serif',   layout_style: 'card', profile_image_shape: 'rounded', link_card_style: 'shadow' },
  gradient:     { label: 'Gradient',     background_color: '#6a4cff', text_color: '#ffffff', button_color: '#ffffff', button_style: 'pill',    font_family: 'sans',    layout_style: 'glass', profile_image_shape: 'circle', link_card_style: 'filled' },
  creative:     { label: 'Creative',     background_color: '#fff1dc', text_color: '#3b1f2b', button_color: '#ff5a5f', button_style: 'pill',    font_family: 'display', layout_style: 'card', profile_image_shape: 'rounded', link_card_style: 'shadow' },
};

export const THEME_KEYS = ['preset', 'background_color', 'text_color', 'button_color', 'button_style', 'font_family', 'layout_style', 'profile_image_shape', 'link_card_style'];
export const pickTheme = (t) => Object.fromEntries(THEME_KEYS.map((k) => [k, t[k]]));
export const fromPreset = (name) => ({ preset: name, ...Object.fromEntries(Object.entries(PRESETS[name]).filter(([k]) => k !== 'label')) });
export const DEFAULT_THEME = fromPreset('light');
