import OpenAI from 'openai';

// テーマ生成用のVercelサーバーレス関数
export default async function handler(req, res) {
    // CORS設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // OpenAI APIキーの確認
        if (!process.env.OPENAI_API_KEY) {
            // APIキーがない場合はフォールバックテーマを返す
            return res.json({
                theme: getFallbackTheme()
            });
        }

        // OpenAIクライアントの初期化
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        // プロンプトを作成
        const prompt = `2ch（2ちゃんねる）のスレッドで議論されそうな、面白いテーマを1つ生成してください。

【要件】
- 2chでよく議論されるような、賛否両論があるテーマ
- 論破・レスバが起こりそうな話題
- 具体的で、ユーザーが意見を書きやすい内容
- 30文字程度で簡潔に
- 例：「テレワークってもう終わりなの？」「AIに仕事奪われるって本当？」「最近の若者はマナーが悪い？」

【出力形式】
テーマだけを1行で出力してください。説明や補足は不要です。`;

        // OpenAI APIを呼び出し
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'あなたは2ch（2ちゃんねる）のスレッドテーマを考える専門家です。議論が白熱しそうな、面白いテーマを生成してください。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.9, // 創造性を高める
            max_tokens: 100
        });

        const generatedTheme = completion.choices[0].message.content.trim();

        // 生成されたテーマを返す
        res.json({
            theme: generatedTheme
        });

    } catch (error) {
        console.error('テーマ生成エラー:', error);
        // エラー時はフォールバックテーマを返す
        res.json({
            theme: getFallbackTheme()
        });
    }
}

// フォールバックテーマ生成（APIキーがない場合）
function getFallbackTheme() {
    const themes = [
        'テレワークってもう終わりなの？',
        'AIに仕事奪われるって本当？',
        '最近の若者はマナーが悪い？',
        'リモートワークって本当に効率的？',
        'SNSは時間の無駄？',
        'プログラミングは誰でもできる？',
        '副業は本業に影響する？',
        '転職は3年以内にすべき？',
        '残業は当たり前？',
        '資格は本当に必要？',
        '大学は行くべき？',
        '起業はリスクが高すぎる？',
        'フリーランスは安定しない？',
        '在宅勤務は生産性が低い？',
        'コミュニケーション能力は鍛えられる？'
    ];
    
    return themes[Math.floor(Math.random() * themes.length)];
}

