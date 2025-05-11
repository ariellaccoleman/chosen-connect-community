
import { useZodForm, formatUrl, cleanFormData } from '@/utils/formUtils';
import { z } from 'zod';
import { renderHook } from '@testing-library/react';

describe('Form Utilities', () => {
  describe('useZodForm', () => {
    test('returns form instance with zod resolver', () => {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email()
      });
      
      const { result } = renderHook(() => useZodForm(schema));
      
      expect(result.current).toHaveProperty('register');
      expect(result.current).toHaveProperty('handleSubmit');
      expect(result.current).toHaveProperty('formState');
      expect(result.current).toHaveProperty('control');
    });
  });

  describe('formatUrl', () => {
    test('adds https protocol to URL without protocol', () => {
      const formattedUrl = formatUrl('example.com');
      expect(formattedUrl).toBe('https://example.com');
    });
    
    test('returns null for empty string', () => {
      expect(formatUrl('')).toBeNull();
    });
    
    test('returns null for undefined or null input', () => {
      expect(formatUrl(undefined)).toBeNull();
      expect(formatUrl(null)).toBeNull();
    });
    
    test('preserves existing protocol in URL', () => {
      expect(formatUrl('http://example.com')).toBe('http://example.com');
      expect(formatUrl('https://secure.example.com')).toBe('https://secure.example.com');
    });
    
    test('handles URLs with whitespace', () => {
      expect(formatUrl('  example.com  ')).toBe('https://example.com');
    });
  });

  describe('cleanFormData', () => {
    test('converts empty strings to null in form data', () => {
      const formData = {
        name: 'John',
        email: 'john@example.com',
        bio: '',
        website: '   ',
        phone: null
      };
      
      const cleanedData = cleanFormData(formData);
      
      expect(cleanedData).toEqual({
        name: 'John',
        email: 'john@example.com',
        bio: null,
        website: null,
        phone: null
      });
    });
    
    test('preserves original data types', () => {
      const formData = {
        name: 'John',
        age: 30,
        active: true,
        notes: ''
      };
      
      const cleanedData = cleanFormData(formData);
      
      expect(cleanedData).toEqual({
        name: 'John',
        age: 30,
        active: true,
        notes: null
      });
    });
    
    test('handles nested objects correctly', () => {
      const formData = {
        user: {
          name: 'John',
          email: 'john@example.com',
          bio: ''
        }
      };
      
      // The function doesn't process nested objects deeply
      const cleanedData = cleanFormData(formData);
      
      expect(cleanedData).toEqual({
        user: {
          name: 'John',
          email: 'john@example.com',
          bio: ''
        }
      });
    });
  });
});
