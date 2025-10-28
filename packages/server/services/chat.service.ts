import OpenAI from 'openai';
import { franc } from 'franc';
import langs from 'langs';
import {
   conversationRepository,
   type Message,
} from '../repositories/conversation.repository';

const client = new OpenAI({
   apiKey: process.env.OPENAI_API_KEY,
});

type ChatResponse = {
   id: string;
   message: string;
};

// Monday.com column IDs mapping
const MONDAY_COLUMNS = {
   NAME: 'name',
   DESCRIPTION: 'product_and_service_description',
   PRICE: 'product_and_service_price',
   SKU: 'product_and_service_sku',
   CATEGORY: 'product_and_service_type',
   DESCRIPTION_TEXT: 'text_mkx4ny88',
   STOCK: 'numeric_mkx425zz',
   ID: 'text_mkx4tp31',
   ITEMS_SOLD: 'numeric_mkx4n3rg',
   CREATED_AT: 'date_mkx4a3hh',
   UPDATED_AT: 'date_mkx42qfz',
   DISCOUNT_PRICE: 'numeric_mkx5jz97',
};

// Function to check if the query is about products/catalog
function isProductRelatedQuery(prompt: string): boolean {
   const productKeywords = [
      // Product types
      'shoe',
      'shoes',
      'sneaker',
      'boot',
      'trainer',
      'cleat',
      'slides',
      'sandals',
      'sock',
      'backpack',
      'bag',
      'tracksuit',
      't-shirt',
      'tee',
      'hoodie',
      'jacket',
      'coat',
      'pants',
      'shorts',
      'skirt',
      'skort',
      'bra',
      'top',
      'leggings',
      'clothing',
      'apparel',
      'accessories',
      'first step',
      'item',
      'product',
      'items',
      // Common actions/intents
      'search',
      'find',
      'show me',
      'looking for',
      'need',
      'want',
      'buy',
      'purchase',
      'available',
      'stock',
      'price',
      'cost',
      'recommend',
      'suggest',
      'have',
      'get',
      'order',
      'where can i',
      'can i find',
      'how much',
      'info',
      'infomation',
      // Categories
      'women',
      'men',
      'kids',
      'boys',
      'girls',
      'children',
      'unisex',
      // Attributes
      'running',
      'training',
      'sport',
      'athletic',
      'casual',
      'outdoor',
      'waterproof',
      'leather',
      'mesh',
      'fleece',
      'primeknit',
      'size',
      'color',
      'first step',
      // Adidas brand & lines
      'adidas',
      'ultraboost',
      'samba',
      'gazelle',
      'campus',
      'superstar',
      'predator',
      'terrex',
      'nmd',
      'forum',
      'stan smith',
      'adi2000',
      'y-3',
      // Hebrew equivalents
      'נעל',
      'נעליים',
      'בגד',
      'בגדים',
      'חולצה',
      'מכנס',
      'מכנסיים',
      'מחיר',
      'מחפש',
      'רוצה',
      'קנייה',
      'זמין',
      'מלאי',
      'ספורט',
      'ריצה',
      'אימון',
      'מעיל',
      'ג’קט',
      'חצאית',
      'טייטס',
      'תיק',
      'גרביים',
      'אדידס',
   ];

   // Normalize the input (handle case, punctuation, etc.)
   const normalizedPrompt = prompt
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ''); // remove punctuation for better matching

   // Check if the prompt contains any keyword
   return productKeywords.some((keyword) => normalizedPrompt.includes(keyword));
}

// Get off-topic message based on detected language
function getOffTopicMessage(prompt: string): string {
   try {
      const langCode = franc(prompt, { minLength: 3 });
      const lang = langs.where('3', langCode);

      const defaultMessage =
         'This chat is only for questions about Adidas products in our catalog. Please ask about shoes, clothing, or accessories from our collection! 👟';

      const messages: Record<string, string> = {
         hebrew:
            "צ'אט זה מיועד רק לשאלות על מוצרי Adidas בקטלוג שלנו. אנא שאל שאלות לגבי נעליים, ביגוד או אביזרים מהקולקציה שלנו! 👟",
         english: defaultMessage,
         french:
            'Ce chat est uniquement pour les questions sur les produits Adidas de notre catalogue. Veuillez poser des questions sur les chaussures, les vêtements ou les accessoires de notre collection ! 👟',
         spanish:
            'Este chat es solo para preguntas sobre productos Adidas en nuestro catálogo. ¡Por favor pregunta sobre zapatos, ropa o accesorios de nuestra colección! 👟',
      };

      const languageKey = lang?.name?.toLowerCase() || 'english';
      return messages[languageKey] ?? messages.english ?? defaultMessage;
   } catch (error) {
      console.error('Error detecting language:', error);
      return 'This chat is only for questions about Adidas products in our catalog. Please ask about shoes, clothing, or accessories from our collection! 👟';
   }
}

// Type definitions for Monday.com API
interface MondayColumnValue {
   id: string;
   text: string | null;
   value: string | null;
}

interface MondayItem {
   id: string;
   name: string;
   column_values: MondayColumnValue[];
}

interface MondayApiResponse {
   data?: {
      boards?: Array<{
         items_page?: {
            items?: MondayItem[];
         };
      }>;
   };
   errors?: Array<{ message: string }>;
}

interface Product {
   mondayId: string;
   name: string;
   description: string;
   price: string;
   discountPrice: string;
   sku: string;
   category: string;
   stock: string;
   itemsSold: string;
   productId: string;
}

// Cache for products to avoid fetching on every request
let productsCache: Product[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper to extract value from column
function getColumnValue(item: MondayItem, columnId: string): string {
   const col = item.column_values.find((c) => c.id === columnId);
   if (!col) return '';

   // Try text first
   if (col.text) return col.text;

   // Try parsing value for complex types
   if (col.value && col.value !== '{}' && col.value !== 'null') {
      try {
         const parsed = JSON.parse(col.value);

         // Handle status columns (category)
         if (parsed.label) return parsed.label;
         if (parsed.text) return parsed.text;

         // Handle number columns
         if (typeof parsed === 'number') return String(parsed);

         // Handle string values
         if (typeof parsed === 'string') return parsed;
      } catch (e) {
         // If parsing fails, return the raw value
         return col.value;
      }
   }

   return '';
}

// Fetch products from Monday.com board with caching
async function fetchProductsFromMonday(): Promise<Product[]> {
   const now = Date.now();

   // Return cached products if still valid
   if (productsCache.length > 0 && now - lastFetchTime < CACHE_DURATION) {
      console.log('✅ Using cached products from Monday.com');
      return productsCache;
   }

   const mondayApiKey = process.env.MONDAY_API_KEY;
   const boardId = process.env.MONDAY_BOARD_ID_CATALOG || '5067290051';

   if (!mondayApiKey) {
      console.error('❌ MONDAY_API_KEY is not set in environment variables');
      throw new Error('Monday.com API key is not configured');
   }

   const query = `
      query {
         boards(ids: [${boardId}]) {
            items_page(limit: 200) {
               items {
                  id
                  name
                  column_values {
                     id
                     text
                     value
                  }
               }
            }
         }
      }
   `;

   try {
      console.log(`🔄 Fetching products from Monday.com board ${boardId}...`);
      const response = await fetch('https://api.monday.com/v2', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            Authorization: mondayApiKey,
            'API-Version': '2024-10',
         },
         body: JSON.stringify({ query }),
      });

      if (!response.ok) {
         const errorText = await response.text();
         console.error(
            `❌ Monday.com API returned status ${response.status}:`,
            errorText
         );
         throw new Error(`Monday.com API error: ${response.status}`);
      }

      const data = (await response.json()) as MondayApiResponse;

      if (data.errors) {
         console.error(
            '❌ Monday.com API errors:',
            JSON.stringify(data.errors, null, 2)
         );
         throw new Error(
            `Monday.com API error: ${data.errors[0]?.message || 'Unknown error'}`
         );
      }

      const items = data.data?.boards?.[0]?.items_page?.items || [];
      console.log(`✅ Fetched ${items.length} items from Monday.com`);

      if (items.length === 0) {
         console.warn('⚠️  No items found in Monday.com board');
         return [];
      }

      // Transform Monday.com items to product format
      const products: Product[] = items.map((item: MondayItem) => {
         // Use the long_text description first, fallback to text description
         const description =
            getColumnValue(item, MONDAY_COLUMNS.DESCRIPTION) ||
            getColumnValue(item, MONDAY_COLUMNS.DESCRIPTION_TEXT);

         return {
            mondayId: item.id,
            name: item.name,
            description: description,
            price: getColumnValue(item, MONDAY_COLUMNS.PRICE),
            discountPrice: getColumnValue(item, MONDAY_COLUMNS.DISCOUNT_PRICE),
            sku: getColumnValue(item, MONDAY_COLUMNS.SKU),
            category: getColumnValue(item, MONDAY_COLUMNS.CATEGORY),
            stock: getColumnValue(item, MONDAY_COLUMNS.STOCK),
            itemsSold: getColumnValue(item, MONDAY_COLUMNS.ITEMS_SOLD),
            productId: getColumnValue(item, MONDAY_COLUMNS.ID),
         };
      });

      console.log(`📦 Processed ${products.length} products`);
      if (products.length > 0) {
         console.log('📋 Sample product:', products[0]);
      }

      // Update cache
      productsCache = products;
      lastFetchTime = now;

      return products;
   } catch (error) {
      console.error('❌ Error fetching from Monday:', error);

      // If we have cached data, return it
      if (productsCache.length > 0) {
         console.log('⚠️  Using stale cached data due to fetch error');
         return productsCache;
      }

      throw error;
   }
}

// Create a formatted product catalog string for the AI
function formatProductsForAI(products: Product[]): string {
   if (products.length === 0) {
      return 'No products currently available in the catalog.';
   }

   return products
      .map((p) => {
         const parts = [
            `Product Name: ${p.name}`,
            p.category ? `Category: ${p.category}` : null,
            p.price ? `Price: $${p.price}` : null,
            p.discountPrice ? `Discount Price: $${p.discountPrice}` : null,
            p.sku ? `SKU: ${p.sku}` : null,
            p.stock ? `Stock: ${p.stock} units` : null,
            p.itemsSold ? `Items Sold: ${p.itemsSold}` : null,
            p.description ? `Description: ${p.description}` : null,
         ].filter(Boolean);

         return parts.join('\n');
      })
      .join('\n\n---\n\n');
}

export const productChatService = {
   async sendMessage(
      prompt: string,
      conversationId: string,
      userId: string
   ): Promise<ChatResponse> {
      try {
         console.log('📨 Processing message:', {
            prompt,
            conversationId,
            userId,
         });

         // Create user message
         const userMessage: Message = {
            sender: 'user',
            text: prompt,
            timestamp: new Date(),
            id: crypto.randomUUID(),
         };
         await conversationRepository.addMessage(
            conversationId,
            userMessage,
            userId
         );

         // Check if query is product-related
         if (!isProductRelatedQuery(prompt)) {
            console.log('⚠️  Query is not product-related');
            const offTopicMsg = getOffTopicMessage(prompt);
            const botMessage: Message = {
               sender: 'bot',
               text: offTopicMsg,
               timestamp: new Date(),
               id: crypto.randomUUID(),
            };
            await conversationRepository.addMessage(
               conversationId,
               botMessage,
               userId
            );
            return { id: botMessage.id, message: offTopicMsg };
         }

         // Fetch products ONLY from Monday.com (no MongoDB)
         let products: Product[];
         try {
            products = await fetchProductsFromMonday();
         } catch (fetchError) {
            console.error('❌ Failed to fetch products:', fetchError);
            const errorMsg =
               "Sorry, I couldn't load the product catalog at the moment. Please check your Monday.com configuration and try again.";
            const botMessage: Message = {
               sender: 'bot',
               text: errorMsg,
               timestamp: new Date(),
               id: crypto.randomUUID(),
            };
            await conversationRepository.addMessage(
               conversationId,
               botMessage,
               userId
            );
            return { id: botMessage.id, message: errorMsg };
         }

         if (products.length === 0) {
            console.warn('⚠️  No products available in catalog');
            const errorMsg =
               'Sorry, there are no products available in the catalog right now.';
            const botMessage: Message = {
               sender: 'bot',
               text: errorMsg,
               timestamp: new Date(),
               id: crypto.randomUUID(),
            };
            await conversationRepository.addMessage(
               conversationId,
               botMessage,
               userId
            );
            return { id: botMessage.id, message: errorMsg };
         }

         const productCatalog = formatProductsForAI(products);
         console.log(`📦 Using ${products.length} products for AI context`);

         // Get conversation history
         const conversation =
            await conversationRepository.getConversation(conversationId);
         const conversationHistory =
            conversation?.messages
               .slice(-10) // Last 10 messages for context
               .map((m: Message) => ({
                  role:
                     m.sender === 'user'
                        ? ('user' as const)
                        : ('assistant' as const),
                  content: m.text,
               })) || [];

         // Create AI response using ONLY Monday.com data
         console.log('🤖 Sending request to OpenAI...');
         const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
               {
                  role: 'system',
                  content: `You are a helpful Adidas product catalog assistant. 
               
Your role:
- Help customers find products from the Adidas catalog
- Answer questions about product features, prices, availability, and stock
- Make recommendations based on customer needs
- Always answer in the SAME LANGUAGE the customer used
- Be friendly, concise, and helpful
- If a product is out of stock or unavailable, suggest alternatives

IMPORTANT: All product information comes directly from our Monday.com board. Only use the products listed below.

Product Catalog (from Monday.com):
${productCatalog}

Guidelines:
- Keep responses under 150 words
- Focus on relevant products from the catalog above
- Mention prices and availability as shown in the catalog
- Include discount prices when available - highlight savings compared to regular price
- Format prices with $ symbol
- If multiple products match, show the top 3-4 options
- When listing products, be concise but informative
- Only recommend products that exist in the catalog above
- If stock is low (less than 10), mention limited availability`,
               },
               ...conversationHistory,
               {
                  role: 'user',
                  content: prompt,
               },
            ],
            temperature: 0.7,
            max_tokens: 500,
         });

         const botText =
            response.choices[0]?.message?.content ||
            "Sorry, I couldn't process your request. Please try again.";

         const botMessage: Message = {
            sender: 'bot',
            text: botText,
            timestamp: new Date(),
            id: response.id,
         };
         await conversationRepository.addMessage(
            conversationId,
            botMessage,
            userId
         );

         console.log('✅ Response generated successfully');
         return { id: botMessage.id, message: botText };
      } catch (error) {
         console.error('❌ Error in sendMessage:', error);
         throw error;
      }
   },

   async generateTitleWithId(conversationId: string): Promise<string> {
      const conversation =
         await conversationRepository.getConversation(conversationId);
      if (!conversation) {
         throw new Error('Conversation not found');
      }

      const joinedMessages = conversation.messages
         .slice(0, 6) // Use first few messages for title
         .map((m: Message) => `${m.sender}: ${m.text}`)
         .join('\n');

      const response = await client.chat.completions.create({
         model: 'gpt-4o-mini',
         messages: [
            {
               role: 'system',
               content:
                  'Generate a short, descriptive title (max 4 words) for this product inquiry conversation.',
            },
            {
               role: 'user',
               content: joinedMessages,
            },
         ],
         temperature: 0.7,
         max_tokens: 20,
      });

      const title =
         response.choices[0]?.message?.content?.trim() || 'Product Inquiry';

      await conversationRepository.setTitle(conversationId, title);

      return title;
   },

   // Optional: Method to manually refresh the product cache
   async refreshProductCache(): Promise<void> {
      lastFetchTime = 0; // Reset cache time to force refresh
      await fetchProductsFromMonday();
      console.log('🔄 Product cache refreshed');
   },
};
