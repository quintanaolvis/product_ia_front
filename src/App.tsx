import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

const AGENT_QUERY_URL =
  "https://falabellav2-a0c8cnapbbg4dtd6.eastus2-01.azurewebsites.net/api/classifier";

interface Message {
  id: number;
  type: "user" | "system" | "error";
  content: string;
  timestamp: Date;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputUrl, setInputUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputUrl.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      type: "user",
      content: inputUrl,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputUrl("");
    setIsLoading(true);

    try {
      const response = await fetch(AGENT_QUERY_URL, {
        method: "POST", // Método POST
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_url: userMessage.content,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${
            response.status
          }. Response: ${errorText.substring(0, 100)}...`
        );
      }

      const data = await response.json();

      if (!data.message) {
        throw new Error(
          `La respuesta no contiene la propiedad "message". Respuesta recibida: ${JSON.stringify(
            data
          ).substring(0, 100)}...`
        );
      }

      // 3. Crear y mostrar el mensaje del sistema (respuesta exitosa)
      const systemMessage: Message = {
        id: Date.now() + 1,
        type: "system",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, systemMessage]);
    } catch (error) {
      // 4. Crear y mostrar el mensaje de error
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: "error",
        content: `Error: No se pudo completar la solicitud. ${
          error instanceof Error ? error.message : "Verifica la URL."
        }`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800">
            Falabella classifier
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Conecta con APIs y visualiza respuestas
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <Send className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-700 mb-2">
                Bienvenido
              </h2>
              <p className="text-slate-500">
                Ingresa la URL de la API para comenzar
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs sm:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl shadow-sm ${
                    message.type === "user"
                      ? "bg-blue-600 text-white rounded-br-md"
                      : message.type === "error"
                      ? "bg-red-100 text-red-800 rounded-bl-md border border-red-200"
                      : "bg-white text-slate-800 rounded-bl-md border border-slate-200"
                  }`}
                >
                  <p className="text-sm break-words">{message.content}</p>
                  <span
                    className={`text-xs mt-1 block ${
                      message.type === "user"
                        ? "text-blue-100"
                        : message.type === "error"
                        ? "text-red-600"
                        : "text-slate-400"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-xs sm:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  <p className="text-sm text-slate-600">
                    Conectando con la API...
                  </p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 px-4 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Introduce la URL de la API (Ej: https://...)"
              className="flex-1 px-4 py-3 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputUrl.trim()}
              className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}

export default App;
