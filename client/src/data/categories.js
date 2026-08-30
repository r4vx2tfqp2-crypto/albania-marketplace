// Was a hand-maintained duplicate of productCategoryData.js's CATEGORIES --
// had drifted to only 7 of the 8 real categories (missing "construction"
// entirely), so the homepage/search "browse by category" grid silently had
// no way to filter to it. `label` here was always dead weight (both
// consumers immediately override it via t(`cat_${id}`)), so deriving from
// the single source of truth loses nothing and can't drift again.
import { CATEGORIES } from './productCategoryData';

export const categories = CATEGORIES.map(c => ({ id: c.key, label: c.label, icon: c.icon }));
