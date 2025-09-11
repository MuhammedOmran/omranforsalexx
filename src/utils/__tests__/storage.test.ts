import { describe, it, expect, beforeEach, vi } from 'vitest'
import { storage, saveData, loadData, validateData } from '../storage'
import { mockLocalStorage } from '@/test/utils/test-utils'

describe('Storage Utils', () => {
  const mockStorage = mockLocalStorage()

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage
    })
  })

  describe('OfflineStorage', () => {
    it('يحفظ البيانات بشكل صحيح', () => {
      const testData = { name: 'اختبار', value: 123 }
      const result = storage.setItem('test-key', testData)
      
      expect(result).toBe(true)
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        expect.stringContaining('"name":"اختبار"')
      )
    })

    it('يسترجع البيانات بشكل صحيح', () => {
      const testData = { name: 'اختبار', value: 123 }
      mockStorage.store['test-key'] = JSON.stringify({
        data: testData,
        timestamp: Date.now(),
        version: '1.0'
      })

      const result = storage.getItem('test-key')
      expect(result).toEqual(testData)
    })

    it('يعيد القيمة الافتراضية عند عدم وجود البيانات', () => {
      const defaultValue = { default: true }
      const result = storage.getItem('non-existent', defaultValue)
      
      expect(result).toEqual(defaultValue)
    })

    it('يحذف البيانات بشكل صحيح', () => {
      const result = storage.removeItem('test-key')
      
      expect(result).toBe(true)
      expect(mockStorage.removeItem).toHaveBeenCalledWith('test-key')
    })

    it('ينظف جميع البيانات', () => {
      const result = storage.clear()
      
      expect(result).toBe(true)
      expect(mockStorage.clear).toHaveBeenCalled()
    })

    it('يصدر البيانات بشكل صحيح', () => {
      mockStorage.store['test1'] = JSON.stringify({ data: 'value1' })
      mockStorage.store['test2'] = JSON.stringify({ data: 'value2' })
      
      const exported = storage.exportData()
      const parsed = JSON.parse(exported)
      
      expect(parsed).toHaveProperty('data')
      expect(parsed).toHaveProperty('exportDate')
      expect(parsed).toHaveProperty('version')
    })

    it('يستورد البيانات بشكل صحيح', () => {
      const importData = {
        data: {
          'key1': 'value1',
          'key2': 'value2'
        },
        exportDate: new Date().toISOString(),
        version: '1.0'
      }
      
      const result = storage.importData(JSON.stringify(importData))
      expect(result).toBe(true)
    })

    it('يتحقق من صحة التخزين', () => {
      const health = storage.checkStorageHealth()
      
      expect(health).toHaveProperty('isHealthy')
      expect(health).toHaveProperty('errors')
      expect(Array.isArray(health.errors)).toBe(true)
    })

    it('يحسب استخدام التخزين', () => {
      const usage = storage.getStorageUsage()
      
      expect(usage).toHaveProperty('used')
      expect(usage).toHaveProperty('total')
      expect(usage).toHaveProperty('usedPercentage')
      expect(typeof usage.used).toBe('number')
      expect(typeof usage.total).toBe('number')
      expect(typeof usage.usedPercentage).toBe('number')
    })
  })

  describe('Helper Functions', () => {
    it('saveData يعمل بشكل صحيح', () => {
      const result = saveData('helper-test', { test: true })
      expect(result).toBe(true)
    })

    it('loadData يعمل بشكل صحيح', () => {
      mockStorage.store['helper-test'] = JSON.stringify({
        data: { test: true },
        timestamp: Date.now()
      })
      
      const result = loadData('helper-test')
      expect(result).toEqual({ test: true })
    })

    it('validateData يتحقق من صحة البيانات', () => {
      expect(validateData({ valid: 'object' })).toBe(true)
      expect(validateData('valid string')).toBe(true)
      expect(validateData(123)).toBe(true)
      
      // البيانات التي لا يمكن تحويلها إلى JSON
      const circular: any = {}
      circular.self = circular
      expect(validateData(circular)).toBe(false)
    })
  })
})