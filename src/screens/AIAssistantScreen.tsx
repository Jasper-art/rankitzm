import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db, ClassEntity, LearnerEntity, SubjectEntity } from "../db";
import { useTheme } from "../hooks/useTheme";
import { LIGHT, DARK, Theme } from "../styles/rankitz-colors";
import { useAuth } from "../context/AuthContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  context?: string;
}

export default function AIAssistantScreen() {
  const navigate = useNavigate();
  const { dark } = useTheme();
  const t = dark ? DARK : LIGHT;
  const { schoolName, schoolId } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedClass, setSelectedClass] = useState<ClassEntity | null>(null);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [learners, setLearners] = useState<LearnerEntity[]>([]);
  const [subjects, setSubjects] = useState<SubjectEntity[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    loadData();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadData = async () => {
    try {
      const allClasses = await db.getAllClasses();
      setClasses(allClasses);
      if (allClasses.length > 0) {
        setSelectedClass(allClasses[0]);
        const classLearners = await db.getLearnersByClass(allClasses[0].id!);
        const classSubjects = await db.getSubjectsByClass(allClasses[0].id!);
        setLearners(classLearners);
        setSubjects(classSubjects);
      }
      loadMessageHistory();
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  const loadMessageHistory = async () => {
    try {
      const allChats = await (window as any).chatStorage?.getChats?.(schoolId);
      if (allChats && allChats.length > 0) {
        setMessages(allChats);
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
    }
  };

  const saveMessageHistory = async (newMessages: Message[]) => {
    try {
      await (window as any).chatStorage?.saveChats?.(schoolId, newMessages);
    } catch (err) {
      console.error("Error saving chat history:", err);
    }
  };

  const handleClassSelect = async (classId: number) => {
    const selected = classes.find((c) => c.id === classId);
    if (selected) {
      setSelectedClass(selected);
      const classLearners = await db.getLearnersByClass(classId);
      const classSubjects = await db.getSubjectsByClass(classId);
      setLearners(classLearners);
      setSubjects(classSubjects);
    }
  };

  const buildContext = (): string => {
    let context = `School: ${schoolName}\n`;
    if (selectedClass) {
      context += `Current Class: ${selectedClass.className} (${selectedClass.educationLevel})\n`;
      context += `Total Learners: ${learners.length}\n`;
      context += `Subjects: ${subjects.map((s) => s.subjectName).join(", ") || "None"}\n`;
    }
    return context;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
      context: buildContext(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const systemPrompt = `You are an AI assistant for Zambian school teachers and headteachers using the RankItZM school management system.

CONTEXT:
${buildContext()}

You help with:
- Class performance analysis and insights
- Student academic guidance and recommendations
- Subject-specific teaching strategies
- School administration advice
- Report writing and documentation
- Curriculum and assessment planning
- Parent communication suggestions

Be professional, encouraging, and specific to Zambian education context. Provide actionable advice.
If the teacher asks about specific students or classes, reference the context above.
Keep responses concise but helpful (2-3 paragraphs max unless they ask for more detail).`;

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(import.meta as any).env?.VITE_GROQ_API_KEY || ""}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
              { role: "user", content: userMessage.content },
            ],
            max_tokens: 500,
            temperature: 0.7,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "API error");
      }

      const data = await response.json();
      const assistantContent = data.choices?.[0]?.message?.content || "";

      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: "assistant",
        content: assistantContent,
        timestamp: Date.now(),
      };

      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);
      await saveMessageHistory(updatedMessages);
    } catch (err: any) {
      setError(err.message || "Failed to get response. Try again.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: t.bg,
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      {showSidebar && (
        <div
          style={{
            width: isMobile ? "100%" : 280,
            background: t.surface,
            borderRight: `1px solid ${t.border}`,
            display: "flex",
            flexDirection: "column",
            zIndex: isMobile ? 100 : 10,
            position: isMobile ? "absolute" : "relative",
            height: "100%",
          }}
        >
          {/* Sidebar Header */}
          <div
            style={{ padding: "16px", borderBottom: `1px solid ${t.border}` }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>
                📚 Classes
              </div>
              {isMobile && (
                <button
                  onClick={() => setShowSidebar(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 18,
                    color: t.textMuted,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Classes List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {classes.length === 0 ? (
              <div
                style={{
                  padding: "16px",
                  color: t.textMuted,
                  fontSize: 12,
                  textAlign: "center",
                }}
              >
                No classes yet. Add a class to get started.
              </div>
            ) : (
              classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => {
                    handleClassSelect(cls.id!);
                    if (isMobile) setShowSidebar(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 8,
                    border: "none",
                    background:
                      selectedClass?.id === cls.id ? t.accentBg : t.surfaceAlt,
                    color: selectedClass?.id === cls.id ? t.accent : t.text,
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 13,
                    fontWeight: selectedClass?.id === cls.id ? 600 : 500,
                    marginBottom: 6,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedClass?.id !== cls.id) {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        t.borderSub;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedClass?.id !== cls.id) {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        t.surfaceAlt;
                    }
                  }}
                >
                  <div>{cls.className}</div>
                  <div
                    style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}
                  >
                    {cls.educationLevel}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Clear History Button */}
          <div style={{ padding: "12px", borderTop: `1px solid ${t.border}` }}>
            <button
              onClick={() => {
                setMessages([]);
                saveMessageHistory([]);
              }}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 8,
                border: `1px solid ${t.border}`,
                background: t.surfaceAlt,
                color: t.textMuted,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              🗑️ Clear History
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: isMobile ? "12px 14px" : "16px 24px",
            background: t.surface,
            borderBottom: `1px solid ${t.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && !showSidebar && (
              <button
                onClick={() => setShowSidebar(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 18,
                  color: t.text,
                }}
              >
                ☰
              </button>
            )}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>
                🤖 AI Assistant
              </div>
              {selectedClass && (
                <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>
                  {selectedClass.className}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate("/home")}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: `1.5px solid ${t.border}`,
              background: t.surfaceAlt,
              cursor: "pointer",
              color: t.textMuted,
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Messages Container */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: isMobile ? "14px" : "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                color: t.textMuted,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: t.text,
                  marginBottom: 6,
                }}
              >
                Welcome to AI Assistant
              </div>
              <div style={{ fontSize: 13, maxWidth: 300, lineHeight: 1.6 }}>
                Ask questions about your class performance, students, teaching
                strategies, or school administration. I'm here to help!
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  maxWidth: isMobile ? "85%" : "60%",
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: msg.role === "user" ? t.accent : t.surfaceAlt,
                  color: msg.role === "user" ? "#fff" : t.text,
                  fontSize: 13,
                  lineHeight: 1.6,
                  wordWrap: "break-word",
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: t.surfaceAlt,
                  color: t.textMuted,
                }}
              >
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: t.accent,
                      animation: "bounce 1.4s infinite",
                    }}
                  />
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: t.accent,
                      animation: "bounce 1.4s infinite",
                      animationDelay: "0.2s",
                    }}
                  />
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: t.accent,
                      animation: "bounce 1.4s infinite",
                      animationDelay: "0.4s",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "12px",
                borderRadius: 8,
                background: t.redBg,
                color: t.red,
                fontSize: 12,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          style={{
            padding: isMobile ? "12px 14px" : "16px 24px",
            background: t.surface,
            borderTop: `1px solid ${t.border}`,
            display: "flex",
            gap: 10,
            alignItems: "flex-end",
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about class performance, students, or teaching strategies..."
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 8,
              border: `1.5px solid ${t.border}`,
              background: t.surfaceAlt,
              color: t.text,
              fontSize: 13,
              fontFamily: "inherit",
              resize: "none",
              maxHeight: 100,
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLTextAreaElement).style.borderColor =
                t.accent;
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLTextAreaElement).style.borderColor =
                t.border;
            }}
            rows={1}
            disabled={loading}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: loading || !input.trim() ? t.border : t.accent,
              color: "#fff",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              fontSize: 12,
              fontWeight: 700,
              transition: "all 0.2s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!loading && input.trim()) {
                (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "1";
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(0)";
            }}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scaleY(0.5);
            opacity: 0.5;
          }
          40% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
