import OpenAI from 'openai';

// Vercelサーバーレス関数
export default async function handler(req, res) {
    // CORS設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userPost, postNumber, residentName, residentStyle, responseIndex, totalResponses, previousPosts } = req.body;

        // バリデーション
        if (!userPost) {
            return res.status(400).json({ 
                error: 'ユーザーの投稿は必須です' 
            });
        }

        // OpenAI APIキーの確認
        if (!process.env.OPENAI_API_KEY) {
            // APIキーがない場合はフォールバックレスを返す
            return res.json({
                content: generateFallbackResponse(userPost, postNumber, residentStyle, responseIndex, totalResponses)
            });
        }

        // OpenAIクライアントの初期化
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        // プロンプトを作成
        const prompt = createPrompt(userPost, postNumber, residentName, residentStyle, responseIndex, totalResponses, previousPosts);

        // OpenAI APIを呼び出し
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // コスト効率の良いモデル
            messages: [
                {
                    role: 'system',
                    content: `あなたは2ch（2ちゃんねる）の住民です。ユーザーの投稿に対して、ウィットに富んだ、機知に満ちた論破・煽り・ツッコミのレスを返してください。

【重要なルール】
- 2ch特有の文体を使う（「ｗ」「草」「お前さぁ…」「はい論破」など）
- ウィットに富んだ、機知に満ちた論破を心がける
- ユーモアのある比喩や例えを使う
- 予想外の角度からのツッコミを入れる
- 人格攻撃・差別・暴力表現は絶対に禁止
- ソフトなブラックジョーク・煽り・論破のみ
- レスは短めに（50文字程度）
- 「>>数字」形式の引用を使う場合は、実際のレス番号を使う
- 複数の住民がいるように、それぞれ異なる口調で
- 住民同士が揉める演出もOK
- 単なる否定ではなく、機知に富んだ反論を`
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.95, // 創造性を高める（ウィットに富んだレス生成のため）
            max_tokens: 150
        });

        const generatedContent = completion.choices[0].message.content.trim();

        // 生成されたレスを返す
        res.json({
            content: generatedContent
        });

    } catch (error) {
        console.error('レス生成エラー:', error);
        // エラー時はフォールバックレスを返す
        res.json({
            content: generateFallbackResponse(
                req.body.userPost || '', 
                req.body.postNumber || 0,
                req.body.residentStyle || {},
                req.body.responseIndex || 0,
                req.body.totalResponses || 1
            )
        });
    }
}

// プロンプトを作成
function createPrompt(userPost, postNumber, residentName, residentStyle, responseIndex, totalResponses, previousPosts) {
    let prompt = `【ユーザーの投稿】
${userPost}

【あなたの役割】
${residentName}として、上記の投稿に対して2ch風のレスを返してください。

【レス番号】
${postNumber}番目のレスです。

【レス位置】
${responseIndex + 1} / ${totalResponses} のレスです。`;

    if (responseIndex === 0) {
        prompt += `\n\n【指示】
最初のレスなので、ユーザーの投稿に直接ツッコミ・論破・煽りをしてください。
ウィットに富んだ、機知に満ちた論破を心がけてください。予想外の角度からのツッコミや、ユーモアのある比喩を使うと良いでしょう。`;
    } else if (responseIndex < totalResponses - 1) {
        prompt += `\n\n【指示】
中間のレスです。他の住民のレスを見て、住民同士で揉める演出や、別視点での論破をしてください。
よりウィットに富んだ、機知に満ちた反論を心がけてください。`;
        
        if (previousPosts && previousPosts.length > 0) {
            prompt += `\n\n【前のレス】
${previousPosts.slice(-2).map((p, i) => `>>${p.number} ${p.resident}: ${p.content}`).join('\n')}`;
        }
    } else {
        prompt += `\n\n【指示】
最後のレスなので、まとめレスとして「結論：>>${postNumber} が間違ってる」のような形で締めてください。
ウィットに富んだ締めくくりを心がけてください。`;
    }

    // スタイルに応じた指示
    if (residentStyle.aggressive > 0.7) {
        prompt += `\n\n【口調】
煽り系の口調で、攻撃的に論破してください。ただし、単なる罵倒ではなく、ウィットに富んだ煽りを心がけてください。`;
    } else if (residentStyle.logical > 0.7) {
        prompt += `\n\n【口調】
論理的に論破してください。矛盾点や論点のずれを指摘してください。ただし、単なる論理の羅列ではなく、機知に富んだ論理展開を心がけてください。`;
    } else if (residentStyle.sarcastic > 0.7) {
        prompt += `\n\n【口調】
皮肉・冷笑的な口調でツッコミを入れてください。ウィットに富んだ皮肉を心がけてください。`;
    }

    prompt += `\n\n【出力】
2ch風のレスを1つだけ出力してください。50文字程度で、短く鋭く、ウィットに富んだ内容にしてください。`;

    return prompt;
}

// フォールバックレス生成（APIキーがない場合）
function generateFallbackResponse(userPost, postNumber, residentStyle, responseIndex, totalResponses) {
    const aggressivePatterns = [
        `お前さぁ…本気で言ってんの？ｗ`,
        `それお前の感想だよね？`,
        `はい論破`,
        `その理論破綻してて草`,
        `お前エスパーかよ`,
        `はい矛盾出たｗ`,
        `それってお前の主観じゃん`,
        `ソースは？`,
        `それってつまり何？`,
        `お前の頭大丈夫？ｗ`,
        `お前の論理、めちゃくちゃすぎて草`,
        `それって思い込みじゃね？`,
        `お前の主張、支離滅裂すぎて草`,
        `それって根拠あるの？`,
        `お前の理論、完全に破綻してる（確信）`,
        `それってつまり「俺が正しい」ってこと？ｗ`,
        `お前の頭、大丈夫？病院行った方がいいんじゃね？ｗ`
    ];
    
    const logicalPatterns = [
        `それって>>${postNumber}の主張と矛盾してない？`,
        `論点ずらしてない？`,
        `具体例出してよ`,
        `データは？`,
        `それって一般化しすぎじゃね？`,
        `例外は考えないの？`,
        `前提が間違ってる気がする`,
        `それって相関と因果の混同じゃね？`,
        `それって論理の飛躍じゃね？`,
        `反証可能性は？`,
        `それって帰納法の誤用じゃね？`,
        `お前の定義、曖昧すぎる`,
        `それってつまり「例外は無視」ってこと？`,
        `お前の論理、完全に破綻してる（確信）`,
        `それって「俺が正しい」って前提で話してない？`
    ];
    
    const sarcasticPatterns = [
        `すごいなぁ、お前の頭の悪さｗ`,
        `まぁそういう考え方もあるよね（白目）`,
        `お前の世界では正しいのかもしれん`,
        `それはそれで面白い意見だなｗ`,
        `なるほど、お前はそう思うのか（察し）`,
        `お前の尺度で測ってるだけじゃね？`,
        `お前の価値観、面白いなｗ`,
        `それはそれで一理ある...わけないだろｗ`,
        `お前の世界観、完全に理解した（白目）`,
        `なるほど、お前はそういう人なんだ（察し）`,
        `お前の論理、面白すぎて草`
    ];
    
    let responseText = '';
    
    if (responseIndex === 0) {
        if (residentStyle.aggressive > 0.7) {
            responseText = aggressivePatterns[Math.floor(Math.random() * aggressivePatterns.length)];
        } else if (residentStyle.logical > 0.7) {
            responseText = logicalPatterns[Math.floor(Math.random() * logicalPatterns.length)];
        } else {
            responseText = sarcasticPatterns[Math.floor(Math.random() * sarcasticPatterns.length)];
        }
    } else if (responseIndex < totalResponses - 1) {
        const rand = Math.random();
        if (rand < 0.5) {
            responseText = logicalPatterns[Math.floor(Math.random() * logicalPatterns.length)];
        } else {
            responseText = aggressivePatterns[Math.floor(Math.random() * aggressivePatterns.length)];
        }
    } else {
        const summaryPatterns = [
            `結論：>>${postNumber} が間違ってる（確信）`,
            `>>${postNumber} お前負けだよｗ`,
            `>>${postNumber} の主張、完全に論破されたな`,
            `>>${postNumber} もう諦めろｗ`,
            `>>${postNumber} の理論、破綻しすぎて草`
        ];
        responseText = summaryPatterns[Math.floor(Math.random() * summaryPatterns.length)];
    }
    
    // ランダムに「ｗ」や「草」を追加
    if (Math.random() > 0.5) {
        const wCount = Math.floor(Math.random() * 5) + 1;
        responseText += 'w'.repeat(wCount);
    }
    if (Math.random() > 0.7) {
        responseText += ' 草';
    }
    
    return responseText;
}

