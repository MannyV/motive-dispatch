from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes
from router import Router
import logging
import traceback

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

    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command."""
        user = update.effective_user.username
        await update.message.reply_text(f"Hello @{user}! I am Fora Atlas. Send me a travel request!")

    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
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

        # Route the message
        try:
            response_text = await self.router.route(message_payload)
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
        
        print("Bot is polling...")
        self.app.run_polling()
