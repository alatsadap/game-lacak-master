'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Brain, CheckCircle, XCircle, Trophy, RotateCcw } from 'lucide-react'
import { shuffleQuestions, type Question } from '@/lib/questions'

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [gameComplete, setGameComplete] = useState(false)
  const [answeredIds, setAnsweredIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    // Only take 5 random questions
    setQuestions(shuffleQuestions().slice(0, 5))
  }, [])

  const currentQuestion = questions[currentIndex]

  const handleAnswer = useCallback((answerIndex: number) => {
    if (showResult || !currentQuestion) return

    setSelectedAnswer(answerIndex)
    setShowResult(true)
    
    const isCorrect = answerIndex === currentQuestion.correctAnswer
    if (isCorrect) {
      setScore(prev => prev + 1)
    }
    setAnswered(prev => prev + 1)
    setAnsweredIds(prev => new Set([...prev, currentQuestion.id]))

    // Move to next question after delay
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        // Find next unanswered question
        let nextIndex = currentIndex + 1
        while (nextIndex < questions.length && answeredIds.has(questions[nextIndex]?.id)) {
          nextIndex++
        }
        
        if (nextIndex >= questions.length) {
          setGameComplete(true)
        } else {
          setCurrentIndex(nextIndex)
          setSelectedAnswer(null)
          setShowResult(false)
        }
      } else {
        setGameComplete(true)
      }
    }, 1500)
  }, [showResult, currentQuestion, currentIndex, questions.length, answeredIds])

  const restartGame = () => {
    setQuestions(shuffleQuestions())
    setCurrentIndex(0)
    setScore(0)
    setAnswered(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setGameComplete(false)
    setAnsweredIds(new Set())
  }

  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0
  const accuracy = answered > 0 ? Math.round((score / answered) * 100) : 0

  if (questions.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <Brain className="h-12 w-12 mx-auto animate-pulse text-primary" />
            <p className="mt-4">Memuat pertanyaan...</p>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (gameComplete) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <Trophy className="h-16 w-16 text-yellow-500" />
            </div>
            <CardTitle className="text-2xl">Permainan Selesai!</CardTitle>
            <CardDescription>
              Terima kasih telah bermain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Skor</p>
                <p className="text-3xl font-bold text-primary">{score}</p>
                <p className="text-xs text-muted-foreground">dari {answered}</p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Akurasi</p>
                <p className="text-3xl font-bold text-primary">{accuracy}%</p>
              </div>
            </div>

            <div className="space-y-2">
              {accuracy >= 80 && (
                <p className="text-green-600 font-medium">Luar biasa! Kamu sangat pintar!</p>
              )}
              {accuracy >= 60 && accuracy < 80 && (
                <p className="text-blue-600 font-medium">Bagus! Terus tingkatkan!</p>
              )}
              {accuracy < 60 && (
                <p className="text-yellow-600 font-medium">Tetap semangat! Terus belajar!</p>
              )}
            </div>

            <Button onClick={restartGame} className="w-full">
              <RotateCcw className="mr-2 h-4 w-4" />
              Main Lagi
            </Button>

            <p className="text-xs text-muted-foreground">
              ID: {id}
            </p>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Tes IQ</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Soal {currentIndex + 1} dari {questions.length}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>Benar: {score}</span>
            <span>Akurasi: {accuracy}%</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <CardTitle className="text-lg leading-relaxed">
              {currentQuestion?.question}
            </CardTitle>
          </div>

          <div className="grid gap-3">
            {currentQuestion?.options.map((option, index) => {
              const isSelected = selectedAnswer === index
              const isCorrect = currentQuestion.correctAnswer === index
              
              let buttonClass = 'w-full justify-start text-left h-auto py-3 px-4'
              
              if (showResult) {
                if (isCorrect) {
                  buttonClass += ' bg-green-100 border-green-500 text-green-800 hover:bg-green-100'
                } else if (isSelected && !isCorrect) {
                  buttonClass += ' bg-red-100 border-red-500 text-red-800 hover:bg-red-100'
                }
              }

              return (
                <Button
                  key={index}
                  variant="outline"
                  className={buttonClass}
                  onClick={() => handleAnswer(index)}
                  disabled={showResult}
                >
                  <span className="flex items-center gap-3 w-full">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {showResult && isCorrect && (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    )}
                  </span>
                </Button>
              )
            })}
          </div>

          {showResult && (
            <div className={`text-center p-3 rounded-lg ${
              selectedAnswer === currentQuestion?.correctAnswer 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {selectedAnswer === currentQuestion?.correctAnswer 
                ? 'Jawaban Benar!' 
                : `Jawaban Salah. Jawaban yang benar: ${currentQuestion?.options[currentQuestion.correctAnswer]}`
              }
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
