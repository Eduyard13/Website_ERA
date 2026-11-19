import assets from './separatsiya-02-presentation-assets.json' with {type:'json'};

// This finish is used only by the detailed line hero. The blue catalogue cover
// and the original technical images keep their existing URLs and metadata.
export const lineHeroPresentation={
 file:assets.hero.file,smallFile:assets.hero.smallFile,width:assets.hero.width,height:assets.hero.height,
 caption:'Общая компоновка линии · исходный инженерный рендер · оформление Titanium Gallery',
};
export const lineConstructionPresentation=assets.diagram;
