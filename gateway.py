from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes
from router import Router
import logging
import traceback
import os

class Gateway:
    def __init__(self, telegram_token: str, supabase_client):
        self.app = ApplicationBuilder().token(telegram_token).build()
        self.router = Router(supabase_client)
        self.setup_handlers()
        
        logging.basicConfig(
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            level=logging.INFO
        )

    def setup_handlers(self):
        """Register command and message handlers."""
        self.app.add_handler(CommandHandler("start", self.start))
        self.app.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), self.handle_message))
        self.app.add_handler(MessageHandler(filters.PHOTO, self.handle_photo))
        self.app.add_handler(MessageHandler(filters.VOICE, self.handle_voice))

    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command."""
        user = update.effective_user.username
        await update.message.reply_text(f"Hello @{user}! I am Fora Atlas. Send me a travel request, a photo, or a voice note!")

    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        # ... (same as before)
        """Handle incoming text messages."""
        text = update.message.text
        user_handle = update.effective_user.username or str(update.effective_user.id)
        
        logging.info(f"Received message from {user_handle}: {text}")

        # Construct payload for Router
        message_payload = {
            "text": text,
            "user_handle": user_handle,
            "raw_update": update.to_dict()
        }

        await self._route_and_reply(update, message_payload)

    async def handle_photo(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        # ... (same as before)
        """Handle incoming photo messages."""
        user_handle = update.effective_user.username or str(update.effective_user.id)
        caption = update.message.caption or ""
        
        # Get the highest resolution photo
        photo_file = await update.message.photo[-1].get_file()
        
        # Download (in memory or temp file)
        os.makedirs("temp", exist_ok=True)
        file_path = f"temp/{photo_file.file_id}.jpg"
        await photo_file.download_to_drive(file_path)
        
        logging.info(f"Received photo from {user_handle} with caption: {caption}")

        message_payload = {
            "text": caption, # Treat caption as text input
            "image_path": file_path,
            "user_handle": user_handle,
            "raw_update": update.to_dict()
        }
        
        await self._route_and_reply(update, message_payload)

    async def handle_voice(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle incoming voice messages."""
        user_handle = update.effective_user.username or str(update.effective_user.id)
        
        voice_file = await update.message.voice.get_file()
        
        # Download
        os.makedirs("temp", exist_ok=True)
        # Telegram usually returns .oga or .ogg for voice
        file_path = f"temp/{voice_file.file_id}.ogg" 
        await voice_file.download_to_drive(file_path)
        
        logging.info(f"Received voice note from {user_handle}")

        message_payload = {
            "text": "[Voice Note]", 
            "audio_path": file_path,
            "user_handle": user_handle,
            "raw_update": update.to_dict()
        }
        
        await self._route_and_reply(update, message_payload)

    async def _route_and_reply(self, update, payload):
        # Route the message
        try:
            response_text = await self.router.route(payload)
            # Send the response back
            await update.message.reply_text(response_text)
        except Exception as e:
            logging.error(f"Error handling message: {e}")
            traceback.print_exc()
            await update.message.reply_text("Sorry, something went wrong while processing your request.")

    def run(self):
        """Start the bot polling (Non-async method for simplicity unless wrapped)."""
        # python-telegram-bot's run_polling handles the event loop internally if needed
        # But since main.py already runs an async loop, we might have a conflict if we call run_polling directly
        # Actually, run_polling blocks.
        # Let's verify usage. Application.run_polling() is synchronous by default and handles signal handlers.
        # But we are calling it inside async main in main.py? No, main.py calls gateway.run().
        # Wait, main.py has `async def main()`. 
        # If I call `gateway.run()` inside `async def main()`, it will block the event loop if it's sync.
        # python-telegram-bot v20+ encourages using `application.run_polling()`.
        
        logging.info("Bot is polling...")
        self.app.run_polling()
