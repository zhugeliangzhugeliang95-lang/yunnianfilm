import {escapeHTML as escape} from './product-view.js';

const copy = {
  en: ['Model specifications, scroll horizontally', ' (as listed)'],
  zh: ['型号规格表，可横向滚动', '（原值）'],
  es: ['Especificaciones del modelo, desplazamiento horizontal', ' (valor original)'],
  fr: ['Caractéristiques des modèles, défilement horizontal', ' (valeur publiée)'],
  ar: ['مواصفات الطراز، يمكن التمرير أفقيًا', ' (كما وردت)'],
};

export function modelTablesHTML(tables, locale, translate) {
  const [label, original] = copy[locale] || copy.en;
  return tables.map(({title, columns, rows}) => {
    const headings = columns.map((term, index) => {
      const decimal = /TSER|UV%|IRR/.test(term) && rows.some(row => /^0\.\d+$/.test(row[index]?.trim() || ''));
      return '<th scope="col">' + escape(decimal ? term.replace(/%/g, '') + original : translate(term)) + '</th>';
    }).join('');
    const body = rows.map(row => '<tr>' + row.map((value, index) => index === 0
      ? '<th scope="row">' + escape(translate(value)) + '</th>'
      : '<td>' + escape(translate(value)) + '</td>').join('') + '</tr>').join('');
    return '<div class="model-table-block">' + (title ? '<h3>' + escape(translate(title)) + '</h3>' : '')
      + '<div class="source-table" tabindex="0" role="region" aria-label="' + escape(label)
      + '"><table><thead><tr>' + headings + '</tr></thead><tbody>' + body + '</tbody></table></div></div>';
  }).join('');
}
