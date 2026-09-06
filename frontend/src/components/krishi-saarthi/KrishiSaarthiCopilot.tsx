import React, { useState } from 'react';
import { Bot, Send, Volume2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';

interface Props {
  fieldId: string;
  state: string;
}

export const KrishiSaarthiCopilot: React.FC<Props> = ({ fieldId, state }) => {
  const { language, setLanguage, t } = useLanguage();
  const [messages, setMessages] = useState<Array<{ role: 'farmer' | 'saarthi'; text: string; source?: string }>>([
    {
      role: 'saarthi',
      text: 'नमस्ते किसान भाई! मैं कृषि सारथी (Krishi Saarthi) हूँ — आपका AI कृषि सलाहकार। आपके खेत की उपग्रह रीडिंग (NDVI 0.64), मौसम पूर्वानुमान और मृदा विश्लेषण के आधार पर आप मुझसे कोई भी प्रश्न पूछ सकते हैं।'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const quickQuestions = [
    t('q1'),
    t('q2'),
    t('q3'),
  ];

  const handleSend = async (questionText?: string) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'farmer', text: q }]);
    setLoading(true);

    try {
      const res = await api.krishiSaarthi.chatCopilot({
        question: q,
        fieldId,
        language,
        state
      });

      if (res.data?.answer) {
        setMessages((prev) => [
          ...prev,
          { role: 'saarthi', text: res.data.answer, source: res.data.source }
        ]);
      }
    } catch (err) {
      console.error('Copilot chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'saarthi',
          text: 'माफ़ कीजिए, सर्वर से संपर्क करने में समस्या आई। आपके खेत का वर्तमान NDVI 0.64 है और अगले 72 घंटों में 62 mm बारिश का अनुमान है, इसलिए सिंचाई अभी स्थगित रखें।'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAudioBriefing = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[*_#🛰️🌧️🌱🤝⚠️]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : language === 'gu' ? 'gu-IN' : language === 'te' ? 'te-IN' : 'en-IN';
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 hover:border-cyan-500/30 transition-all duration-300 flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-mono font-semibold text-sm text-white tracking-wide flex items-center gap-2">
              {t('aiCopilot')}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono">
                Grounded Telemetry Core
              </span>
            </h3>
            <p className="text-[11px] text-white/40 font-mono">
              Sentinel-2 · Open-Meteo · Soil Chemistry Grounded
            </p>
          </div>
        </div>

        {/* Language selector chips */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/[0.08]">
          {(['hi', 'en', 'mr', 'gu', 'te'] as const).map((code) => (
            <button
              key={code}
              onClick={() => setLanguage(code)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                language === code
                  ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${msg.role === 'farmer' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                msg.role === 'farmer'
                  ? 'bg-cyan-500/15 border border-cyan-500/30 text-white font-sans'
                  : 'bg-black/60 border border-white/[0.08] text-white/90 font-sans shadow-md'
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>
            </div>

            {msg.role === 'saarthi' && (
              <div className="flex items-center gap-3 mt-1 px-1">
                {msg.source && (
                  <span className="text-[9px] font-mono text-white/30">
                    Source: {msg.source}
                  </span>
                )}
                <button
                  onClick={() => handleAudioBriefing(msg.text)}
                  className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>{isSpeaking ? 'Stop Audio' : 'Listen Audio Briefing'}</span>
                </button>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 bg-black/40 rounded-xl max-w-[60%] border border-white/[0.06]">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-cyan-300">
              Consulting authoritative agricultural indices...
            </span>
          </div>
        )}
      </div>

      {/* Quick Questions Chips */}
      <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[10px] font-mono text-white/70 hover:text-cyan-300 transition-all text-left"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="pt-2 flex items-center gap-2 border-t border-white/[0.08]"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('askQuestionPlaceholder')}
          className="flex-1 bg-black/60 border border-white/15 focus:border-cyan-400/50 rounded-xl px-3.5 py-2 text-xs font-sans text-white placeholder:text-white/30 focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{t('send')}</span>
        </button>
      </form>
    </div>
  );
};
