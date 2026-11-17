import { countBlanks } from '../../../studio/constants/h5pModel';
import type {
  BlanksElement,
  DragWordsElement,
  MarkWordsElement,
  SlideElement,
} from '../../../studio/constants/h5pModel';

export function TextSyntaxEditor({
  element,
  onPatch,
}: {
  element: BlanksElement | DragWordsElement | MarkWordsElement;
  onPatch: (patch: Partial<SlideElement>) => void;
}) {
  return (
    <>
      <label className="field-label">
        Tulis soalnya di sini
        <textarea
          rows={3}
          value={'text' in element ? element.text : ''}
          onChange={(e) => onPatch({ text: e.target.value })}
          placeholder={
            element.kind === 'blanks'
              ? 'Tulis jawaban di antara *bintang*, cth: Ibukota Indonesia adalah *Jakarta*.'
              : element.kind === 'dragWords'
                ? 'Wrap kata yang bisa di-drag dalam *bintang*: Drag *kata* ke tempat yang *tepat*.'
                : 'Tandai kata kunci dalam *bintang*: Ini adalah *kata kunci*.'
          }
        />
      </label>
      {'text' in element && (
        <p className="muted">Ada {countBlanks(element.text)} kata yang ditandai.</p>
      )}
    </>
  );
}
