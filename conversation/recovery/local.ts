import { guiApi } from '../api';
import { createRecoveryClient } from './types';

export const localRecovery = createRecoveryClient(body => guiApi.request(body), listener => guiApi.subscribe(listener));
