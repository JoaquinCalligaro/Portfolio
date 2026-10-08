import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyDraft } from '../src/lib/preview/apply-draft.ts';
import { parseDraft } from '../src/lib/preview/parse-draft.ts';

const data = {
  profile: { name: 'Ana', headlineEs: 'Hola', headlineEn: 'Hi', bioEs: ['a'], bioEn: ['a-en'] },
  socialLinks: [{ id: 's1', label: 'GH', url: 'https://github.com/a', hidden: false }],
  techCategories: [
    {
      id: 'c1',
      nameEs: 'Front',
      nameEn: 'Front',
      techs: [{ id: 't1', name: 'React', hidden: false }],
    },
  ],
  education: [{ id: 'e1', institution: 'UBA', datesEs: '2020', datesEn: '2020', hidden: false }],
  projects: [{ id: 'p1', titleEs: 'Uno', titleEn: 'One', hidden: false, featured: false }],
} as any;

const draft = (d: object) => parseDraft(JSON.stringify(d));

test('profile merge copies ES into EN', () => {
  const out = applyDraft(data, draft({ section: 'profile', values: { headlineEs: 'Nuevo' } }));
  assert.equal(out.profile.headlineEs, 'Nuevo');
  assert.equal(out.profile.headlineEn, 'Nuevo');
  assert.equal(out.profile.name, 'Ana');
});

test('projects: edit, create and hide', () => {
  const edit = applyDraft(data, draft({ section: 'projects', id: 'p1', values: { titleEs: 'Dos' } }));
  assert.equal(edit.projects[0].titleEs, 'Dos');
  assert.equal(edit.projects[0].titleEn, 'Dos');
  const created = applyDraft(data, draft({ section: 'projects', values: { titleEs: 'N', descriptionEs: 'd' } }));
  assert.equal(created.projects.length, 2);
  const hidden = applyDraft(data, draft({ section: 'projects', id: 'p1', values: {}, hidden: true }));
  assert.equal(hidden.projects[0].hidden, true);
});

test('socialLinks and education: hidden are removed', () => {
  const s = applyDraft(data, draft({ section: 'socialLinks', id: 's1', values: {}, hidden: true }));
  assert.equal(s.socialLinks.length, 0);
  const e = applyDraft(data, draft({ section: 'education', id: 'e1', values: { institution: 'X' } }));
  assert.equal(e.education[0].institution, 'X');
  const n = applyDraft(data, draft({ section: 'education', values: { institution: 'Nueva' } }));
  assert.equal(n.education.length, 2);
});

test('techs: add into category, hide, and empty category is dropped', () => {
  const add = applyDraft(data, draft({ section: 'techs', parentId: 'c1', values: { name: 'Vue' } }));
  assert.equal(add.techCategories[0].techs.length, 2);
  const hide = applyDraft(data, draft({ section: 'techs', id: 't1', parentId: 'c1', values: {}, hidden: true }));
  assert.equal(hide.techCategories.length, 0);
  const newCat = applyDraft(data, draft({ section: 'techCategories', values: { nameEs: 'Back' } }));
  assert.equal(newCat.techCategories.length, 1);
});

test('does not mutate the input', () => {
  applyDraft(data, draft({ section: 'techs', parentId: 'c1', values: { name: 'Vue' } }));
  assert.equal(data.techCategories[0].techs.length, 1);
});

test('parseDraft rejects bad input', () => {
  assert.throws(() => draft({ section: 'nope', values: {} }), /Sección desconocida/);
  assert.throws(
    () => draft({ section: 'projects', id: 'p1', values: { repo: 'javascript:alert(1)' } }),
    /http/
  );
  assert.throws(
    () => draft({ section: 'socialLinks', values: { label: 'x', url: 'javascript:1' } }),
    /https/
  );
  assert.throws(() => draft({ section: 'projects', values: { titleEs: '' } }), /título/);
  assert.throws(() => parseDraft('x'.repeat(300 * 1024)), (e: any) => e.status === 413);
  assert.throws(() => parseDraft('{no json'), /no es válido/);
});
