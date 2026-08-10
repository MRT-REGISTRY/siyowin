import { repo } from '../data/repository.js';

export const publicService = {
  async getMarksheet(params: {
    subjectId: string;
    examType: string;
    examName: string;
    examDate: string;
    username?: string;
  }) {
    return repo.getPublicMarksheet(params);
  },
};
