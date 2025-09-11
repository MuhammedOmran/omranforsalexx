import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// إعداد خادم MSW للاختبارات
export const server = setupServer(...handlers)