import { useState, useMemo } from "react";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from "rehype-raw";
import remarkGfm from 'remark-gfm';
import clsx from 'clsx';

const DEFAULT_MARKDOWN = `
# Reactとは？

Reactは、Facebookによって開発された、ユーザーインターフェースを構築するためのJavaScriptライブラリです。
主にシングルページアプリケーション（SPA）のビュー部分を担当します。

## 主な特徴

- **コンポーネントベース**: UIを独立した再利用可能な部品（コンポーネント）に分割して構築します。
- **宣言的なUI**: Reactは、アプリケーションの状態が変化したときにUIがどのように見えるべきかを記述するだけで、Reactが効率的にDOMを更新します。
- **Learn Once, Write Anywhere**: ReactはWebアプリケーションだけでなく、React Nativeを使えばネイティブモバイルアプリケーションも開発できます。

## サンプルコード

\`\`\`javascript
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}
\`\`\`

上の例では、\`Welcome\`というReactコンポーネントを定義しています。
この文章を使って、穴埋め問題を作成するテストをしてみてください。
`;

type AnswerData = {
  number: number;
  word: string;
};

type viewModeType = 'select' | 'quiz';
type displayModeType = 'markdown' | 'preview' | 'separate';

function App() {
  // 画面の表示モードを管理するstate ('markdown' | 'preview' | 'separate')
  const [displayModeType, setDisplayModeType] = useState<displayModeType>('separate');
  // プレビューの表示モードを管理するstate ('select' or 'quiz')
  const [viewMode, setViewMode] = useState<viewModeType>('select');
  // テキストエディタの原文を保持するstate
  const [markdown, setMarkdown] = useState<string>(DEFAULT_MARKDOWN);
  // 作成された穴埋め問題を保持するstate
  const [quizText, setQuizText] = useState<string>('');
  // 穴埋め対象として選択された単語を保持するstate
  const [selections, setSelections] = useState(new Set<string>());
  // 問題番号と答えの単語を格納するstate
  const [quizAnswers, setQuizAnswers] = useState<Array<AnswerData>>([]);

  /**
   * プレビューエリアでテキストが選択されたときに呼ばれるハンドラ
   */
  const handleSelection = () => {
    // 単語セレクトモード以外では選択を無効にする
    if (viewMode !== 'select') return;
    
    const selectedText = window.getSelection()?.toString().trim();
    if (selectedText) {
      setSelections(prev => new Set(prev).add(selectedText));
    }
  };

  /**
   * プレビューエリアがクリックされたときに呼ばれるハンドラ
   */
  const handlePreviewClick = (e: any) => {
    // 単語セレクトモードで、かつ<mark>タグがクリックされた場合のみ処理
    if (viewMode === 'select' && e.target.tagName === 'MARK') {
      const word = e.target.innerText;
      if (word) {
        setSelections(prev => {
          const newSelections = new Set(prev);
          newSelections.delete(word);
          return newSelections;
        });
      }
    }
  };

  /**
   * 穴埋め問題のテキストを生成し、答えをstateに保存する関数
   */
  const generateAndSetQuiz = () => {
    if (selections.size === 0) return;

    const wordsToReplace = Array.from(selections);
    let newQuizText = markdown;
    let questionCounter = 1;
    const newAnswers: Array<AnswerData> = []; // 解答を一時的に格納する配列

    wordsToReplace.forEach(word => {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedWord, 'g');
      
      // 問題文を生成
      newQuizText = newQuizText.replace(regex, `<span class="question-target"> ( No.${questionCounter} ) </span>`);
      
      // 解答リストに追加
      newAnswers.push({ number: questionCounter, word: word });
      
      questionCounter++;
    });

    setQuizText(newQuizText);
    setQuizAnswers(newAnswers); // 解答リストをstateに保存
    setViewMode('quiz'); // モードを切り替え
  };

  /**
   * プレビュー用に、選択された単語をハイライトしたテキストを生成
   */
  const highlightedText = useMemo(() => {
    if (selections.size === 0) {
      // return markdown.replace(/\n/g, '<br />');
      return markdown;
    }
    let tempText = markdown;
    const wordsToHighlight = Array.from(selections);
    
    wordsToHighlight.forEach(word => {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedWord, 'g');
      tempText = tempText.replace(regex, `<mark class="bg-yellow-300 px-1 rounded cursor-pointer">${word}</mark>`);
    });

    // return tempText.replace(/\n/g, '<br />');
    return tempText;
  }, [markdown, selections]);

  /**
   * 表示するテキストを現在のモードに応じて決定
   */
  const previewContent = useMemo(() => {
    if (viewMode === 'quiz') {
      // return quizText.replace(/\n/g, '<br />');
      return quizText;
    }
    return highlightedText;
  }, [viewMode, quizText, highlightedText]);
  console.log(previewContent);

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-100 font-sans text-gray-800">
      {/* ヘッダー */}
      <header className="bg-white shadow-md p-4 z-10">
        <h1 className="text-2xl font-bold text-gray-900">Markdown 穴埋め問題メーカー</h1>
        <p className="text-sm text-gray-600">テキストを貼り付け、プレビュー上の単語を選択して問題を作成します。</p>
      </header>

      {/* メインコンテンツ */}
      <main className="flex flex-1 min-h-0 p-4 gap-4">
        {/* 左パネル: テキストエディタ */}
        { displayModeType !== 'preview' && (
          <div className={clsx("flex flex-col", {
            "w-1/2": displayModeType === 'separate',
            "w-full": displayModeType === 'markdown',
          })}>
            <div className="flex h-12 justify-between items-center mb-2">
              <label htmlFor="markdown-editor" 
                className={clsx("text-lg items-center font-semibold text-gray-700 p-2", { "hover:bg-blue-100": displayModeType === 'separate'})}
                onClick={() => setDisplayModeType('markdown')}
              >
                テキストエディタ
              </label>
              {displayModeType !== 'separate' && (
                <div className="flex text-sm rounded-lg border border-gray-300 p-2 hover:bg-gray-50 cursor-pointer" onClick={() => setDisplayModeType('separate')}> プレビューを表示</div>
              )}
            </div>
            <textarea
              id="markdown-editor"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="flex-1 p-4 border border-gray-300 rounded-lg shadow-inner resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="ここにテキストを貼り付け..."
            />
          </div>
        )}

        {/* 右パネル: プレビューと操作 */}
        { displayModeType !== 'markdown' && (
          <div className={clsx("flex flex-col", {
            "w-1/2": displayModeType === 'separate',
            "w-full": displayModeType === 'preview',
          })}>
            <div className="flex h-12 gap-2 items-center mb-2">
              {displayModeType !== 'separate' && (
                <div className="flex text-sm w-fit rounded-lg border border-gray-300 p-2 hover:bg-gray-50 cursor-pointer whitespace-nowrap mr-2" onClick={() => setDisplayModeType('separate')}>
                  エディタを表示
                </div>
              )}
              <div className="w-full">
                <label htmlFor="markdown-editor" 
                  className={clsx("text-lg text-left items-center font-semibold text-gray-700 p-2", { "hover:bg-blue-100": displayModeType === 'separate'})}
                  onClick={() => setDisplayModeType('preview')}
                >
                  プレビュー
                </label>
              </div>
              {/* モード切替ボタン */}
              <div className="flex rounded-lg border border-gray-300">
                <button
                  onClick={() => setViewMode('select')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-lg transition whitespace-nowrap ${
                    viewMode === 'select' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  単語セレクトモード
                </button>
                <button
                  onClick={generateAndSetQuiz}
                  disabled={selections.size === 0}
                  className={`px-4 py-2 text-sm font-medium rounded-r-lg transition whitespace-nowrap ${
                    viewMode === 'quiz' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  } disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed`}
                >
                  穴埋め問題表示モード
                </button>
              </div>
            </div>
            {/* プレビューと解答のコンテナ */}
            <div className="flex flex-col flex-1 min-h-0 gap-4">
              {/* プレビューボックス */}
              <div
                onMouseUp={handleSelection}
                onClick={handlePreviewClick}
                className="flex-1 p-6 border border-gray-300 rounded-lg bg-white shadow-inner overflow-y-auto"
              >
                <div className="break-words">
                  <ReactMarkdown rehypePlugins={[rehypeRaw, remarkGfm]}>{previewContent}</ReactMarkdown>
                </div>
              </div>
              {/* 解答ボックス */}
              {viewMode === 'quiz' && quizAnswers.length > 0 && (
                <div className="flex-shrink-0 p-6 border border-gray-300 rounded-lg bg-white shadow-inner overflow-y-auto max-h-48">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">解答</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {quizAnswers.map(answer => (
                      <li key={answer.number}>
                        <strong>( No.{answer.number} )</strong>: {answer.word}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App
