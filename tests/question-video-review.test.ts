import {describe,it,expect} from 'vitest';
import {QUESTION_VIDEO_MANIFEST,resolveQuestionVideoHelp} from '../src/shared/question-videos/question-video-help.mjs';

describe('question-specific examples',()=>{
  it('offers the English greeting help only on its mapped exercises',()=>{
    expect(resolveQuestionVideoHelp({targetLanguage:'en',lessonId:'a1-u1-l1',questionId:'a1-u1-l1:4'})?.conceptId).toBe('ingles-morning-greeting');
    expect(resolveQuestionVideoHelp({targetLanguage:'en',lessonId:'a1-u1-l1',questionId:'a1-u1-l1:99'})).toBeNull();
  });
  it('keeps every unreviewed video disabled',()=>{
    for(const c of QUESTION_VIDEO_MANIFEST.concepts){
      expect(c.status).toBe('draft');expect(c.video.src).toBeNull();
    }
  });
  it('does not present electricity units as an explanation of a utilities bill',()=>{
    expect(resolveQuestionVideoHelp({lessonId:'uk-facturas-l1',questionId:'uk-facturas-l1:0',track:'life'})).toBeNull();
  });
});
