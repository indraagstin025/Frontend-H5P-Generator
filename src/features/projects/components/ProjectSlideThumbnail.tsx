import { useEffect, useState } from 'react';
import { fetchServerProject, isServerProjectId } from '../../ingest/api/serverIngest';
import type { Project, SlideElement } from '../../studio/constants/h5pModel';
import { getStoredUser, loadPendingSyncIds } from '../../../services/authService';

function content(element: SlideElement) {
  if (element.displayAsButton) return element.popupButtonInvisible ? null : <span>{element.buttonLabel || element.title || 'Interaksi'}</span>;
  if (element.kind === 'advancedText') return <span style={{ fontSize: element.fontSize ?? 13 }}>{element.text}</span>;
  if (element.kind === 'image') return element.objectUrl ? <img src={element.objectUrl} alt="" /> : null;
  if (element.kind === 'shape') return <div style={{ width: '100%', height: '100%', background: element.color, borderRadius: element.shapeType === 'circle' ? '50%' : 0 }} />;
  if (element.kind === 'goToSlide') return element.invisible ? null : element.label;
  if (element.kind === 'link') return element.linkText || element.url;
  if ('text' in element) return element.text;
  if ('question' in element) return element.question;
  if (element.kind === 'video' || element.kind === 'audio') return element.fileName || (element.kind === 'video' ? 'Video' : 'Audio');
  return element.title;
}

export function ProjectSlideThumbnail({ project }: { project: Project }) {
  const [loaded, setLoaded] = useState<{ source: Project; project: Project } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!isServerProjectId(project.id) || loadPendingSyncIds(getStoredUser()?.id).has(project.id)) return;
    let cancelled = false;
    void fetchServerProject(project.id).then((fresh) => {
      if (!cancelled) setLoaded({ source: project, project: fresh });
    }).catch(() => {
      if (!cancelled) setFailed(true);
    });
    return () => { cancelled = true; };
  }, [project]);
  const snapshot = loaded?.source === project ? loaded.project : project;
  const slide = snapshot.slides[0];
  const height = snapshot.settings.aspect === '4:3' ? 720 : 540;
  return (
    <div className="materials-slide-thumbnail" role="img" aria-label={`Pratinjau slide pertama ${project.title}`}>
      {slide ? <svg viewBox={`0 0 960 ${height}`} width="100%" aria-hidden="true">
        <foreignObject width="960" height={height}>
          <div className="materials-slide-surface" style={{ height }}>
            {slide.backgroundUrl && <img className="materials-slide-background" src={slide.backgroundUrl} alt="" />}
            {slide.elements.map((element) => <div key={element.id} className="materials-slide-element" style={{ left: `${element.position.x}%`, top: `${element.position.y}%`, width: `${element.position.width}%`, height: `${element.position.height}%`, transform: `rotate(${element.rotation ?? 0}deg)` }}>{content(element)}</div>)}
          </div>
        </foreignObject>
      </svg> : <span>{failed ? 'Pratinjau belum tersedia' : 'Belum ada slide'}</span>}
    </div>
  );
}
