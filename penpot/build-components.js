// Penpot MCP `execute_code` script: builds a token-driven component set
// (Buttons, Badges, Input, Card) on the current page, styled entirely from
// an imported design-foundation-generator tokens.json — no hardcoded values.
//
// Precondition: tokens.json (see tokens.example.json in this folder) has
// been imported via Tokens -> TOOLS -> Import, and the "Global" set is
// active. Paste this whole block into `execute_code` as-is.
//
// STATUS: reconstructed from a prior session where each piece was proven
// working one call at a time via execute_code. This consolidated version
// has not itself been run yet — do that first via TESTING.md and patch
// whatever Penpot's own error messages point at before trusting it blind.
//
// Known API gotchas this script works around (found the hard way last time):
// 1. shape.applyToken(radiusToken, ['all']) is NOT valid for border-radius —
//    Penpot requires the four explicit corner properties.
// 2. On a Text shape, resize() always resets growType back to 'fixed'.
//    Always call resize() BEFORE setting growType, never after.
// 3. To tint a stroke via a color token, the shape needs a stroke entry to
//    begin with — applyToken can't create one from nothing.

const RADIUS_CORNERS = ['borderRadiusTopLeft', 'borderRadiusTopRight', 'borderRadiusBottomRight', 'borderRadiusBottomLeft'];

function findToken(name) {
  const token = penpotUtils.findTokenByName(name);
  if (!token) throw new Error(`Token not found: ${name}`);
  return token;
}

function applyFill(shape, tokenName) {
  shape.applyToken(findToken(tokenName), ['fill']);
}

function applyStrokeColor(shape, tokenName) {
  shape.applyToken(findToken(tokenName), ['strokeColor']);
}

function applyRadius(shape, tokenName) {
  shape.applyToken(findToken(tokenName), RADIUS_CORNERS);
}

function applyTypography(text, tokenName) {
  text.applyToken(findToken(tokenName), ['typography']);
}

function applyPadding(board, tokenName, sides = ['paddingLeft', 'paddingTop', 'paddingRight', 'paddingBottom']) {
  board.applyToken(findToken(tokenName), sides);
}

function applyGap(board, tokenName, sides = ['rowGap', 'columnGap']) {
  board.applyToken(findToken(tokenName), sides);
}

function makeAutoBoard(name, dir = 'row') {
  const board = penpot.createBoard();
  board.name = name;
  board.addFlexLayout();
  board.flex.dir = dir;
  board.flex.horizontalSizing = 'auto';
  board.flex.verticalSizing = 'auto';
  board.flex.alignItems = 'center';
  board.flex.justifyContent = 'center';
  return board;
}

function makeLabel(content, typographyToken, colorToken) {
  const text = penpot.createText(content);
  text.resize(text.width, text.height); // lock a concrete size first...
  text.growType = 'auto-width';         // ...then switch to auto-sizing (order matters, see gotcha #2)
  applyTypography(text, typographyToken);
  applyFill(text, colorToken);
  return text;
}

function makeButton(label, fillToken, textToken) {
  const board = makeAutoBoard(`Button / ${label}`);
  applyFill(board, fillToken);
  applyRadius(board, 'radius.radius-sm');
  applyPadding(board, 'spacing.space-4', ['paddingTop', 'paddingBottom']);
  applyPadding(board, 'spacing.space-6', ['paddingLeft', 'paddingRight']);
  board.appendChild(makeLabel(label, 'typography.paragraph-semibold', textToken));
  return board;
}

function makeBadge(label, fillToken, textToken) {
  const board = makeAutoBoard(`Badge / ${label}`);
  applyFill(board, fillToken);
  applyRadius(board, 'radius.radius-full');
  applyPadding(board, 'spacing.space-1', ['paddingTop', 'paddingBottom']);
  applyPadding(board, 'spacing.space-3', ['paddingLeft', 'paddingRight']);
  board.appendChild(makeLabel(label, 'typography.small-semibold', textToken));
  return board;
}

function makeInputField(placeholder) {
  const board = makeAutoBoard('Input');
  board.flex.justifyContent = 'flex-start';
  applyFill(board, 'surface');
  board.strokes = [{ strokeColor: '#000000', strokeWidth: 1, strokeStyle: 'solid', strokeAlignment: 'inner' }];
  applyStrokeColor(board, 'outline');
  applyRadius(board, 'radius.radius-sm');
  applyPadding(board, 'spacing.space-3', ['paddingTop', 'paddingBottom']);
  applyPadding(board, 'spacing.space-4', ['paddingLeft', 'paddingRight']);
  board.appendChild(makeLabel(placeholder, 'typography.paragraph-regular', 'on-surface-variant'));
  return board;
}

function makeCard(title, body) {
  const board = makeAutoBoard('Card', 'column');
  board.flex.alignItems = 'flex-start';
  applyFill(board, 'surface-container');
  applyRadius(board, 'radius.radius-md');
  applyPadding(board, 'spacing.space-6');
  applyGap(board, 'spacing.space-2');
  board.appendChild(makeLabel(title, 'typography.lg', 'on-surface'));
  board.appendChild(makeLabel(body, 'typography.paragraph-regular', 'on-surface-variant'));
  return board;
}

// M3 has no native "info"/"success" color role, so badges borrow the
// -container tones from tertiary/secondary for that softer look. Revisit
// this mapping if the design system later adds real semantic roles.
const root = makeAutoBoard('Design Foundation Components', 'column');
root.flex.alignItems = 'flex-start';
applyFill(root, 'background');
applyPadding(root, 'spacing.space-12');
applyGap(root, 'spacing.space-12');

const buttons = makeAutoBoard('Buttons');
applyGap(buttons, 'spacing.space-4');
buttons.appendChild(makeButton('Primary', 'primary', 'on-primary'));
buttons.appendChild(makeButton('Secondary', 'secondary', 'on-secondary'));
buttons.appendChild(makeButton('Danger', 'error', 'on-error'));
root.appendChild(buttons);

const badges = makeAutoBoard('Badges');
applyGap(badges, 'spacing.space-3');
badges.appendChild(makeBadge('Info', 'tertiary-container', 'on-tertiary-container'));
badges.appendChild(makeBadge('Success', 'secondary-container', 'on-secondary-container'));
badges.appendChild(makeBadge('Danger', 'error-container', 'on-error-container'));
root.appendChild(badges);

root.appendChild(makeInputField('Email address'));
root.appendChild(makeCard('Card title', 'Supporting body copy for this card, styled entirely from imported tokens.'));

return { id: root.id, name: root.name };
