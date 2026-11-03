import unittest
import os
import json

from app import app, limiter
from config import MAX_MESSAGE_LENGTH

class ChatbotApiTests(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        limiter.enabled = False
        self.client = app.test_client()

    def test_health_endpoint(self):
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data.get('status'), 'healthy')
        self.assertEqual(data.get('service'), 'FoodShare Chatbot')
        self.assertIn('provider_configured', data)

    def test_chat_non_json(self):
        response = self.client.post('/chat', data='not json')
        self.assertEqual(response.status_code, 400)

    def test_chat_missing_message(self):
        response = self.client.post('/chat', json={})
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn('error', data)

    def test_chat_empty_message(self):
        response = self.client.post('/chat', json={'message': '   '})
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertEqual(data.get('error'), 'Message cannot be empty')

    def test_chat_non_string_message(self):
        response = self.client.post('/chat', json={'message': 12345})
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertEqual(data.get('error'), 'Message must be a string')

    def test_chat_message_too_long(self):
        long_msg = 'a' * (MAX_MESSAGE_LENGTH + 1)
        response = self.client.post('/chat', json={'message': long_msg})
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn('too long', data.get('error', ''))

    def test_chat_grounded_fallback_response(self):
        response = self.client.post('/chat', json={'message': 'How does donation work?'})
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('response', data)
        self.assertTrue(len(data['response']) > 0)
        self.assertIn('conversation_id', data)

if __name__ == '__main__':
    unittest.main()
