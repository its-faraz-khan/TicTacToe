import math
import random
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

WIN_LINES = [
    (0, 1, 2), (3, 4, 5), (6, 7, 8),
    (0, 3, 6), (1, 4, 7), (2, 5, 8),
    (0, 4, 8), (2, 4, 6),
]


def check_terminal(board):
    for a, b, c in WIN_LINES:
        if board[a] and board[a] == board[b] == board[c]:
            return board[a], [a, b, c]
    if all(cell != "" for cell in board):
        return "draw", None
    return None, None


def minimax(board, is_max, ai, human, depth, alpha, beta):
    winner, _ = check_terminal(board)
    if winner == ai:
        return 10 - depth
    if winner == human:
        return depth - 10
    if winner == "draw":
        return 0

    if is_max:
        best = -math.inf
        for i in range(9):
            if board[i] == "":
                board[i] = ai
                score = minimax(board, False, ai, human, depth + 1, alpha, beta)
                board[i] = ""
                if score > best:
                    best = score
                if best > alpha:
                    alpha = best
                if beta <= alpha:
                    break
        return best
    else:
        best = math.inf
        for i in range(9):
            if board[i] == "":
                board[i] = human
                score = minimax(board, True, ai, human, depth + 1, alpha, beta)
                board[i] = ""
                if score < best:
                    best = score
                if best < beta:
                    beta = best
                if beta <= alpha:
                    break
        return best


def best_move(board, ai, human):
    best_score = -math.inf
    move = -1
    for i in range(9):
        if board[i] == "":
            board[i] = ai
            score = minimax(board, False, ai, human, 0, -math.inf, math.inf)
            board[i] = ""
            if score > best_score:
                best_score = score
                move = i
    return move


def blunder_move(board, ai, human):
    optimal = best_move(board, ai, human)
    empty = [i for i in range(9) if board[i] == ""]
    non_optimal = [i for i in empty if i != optimal]
    if not non_optimal:
        return optimal
    return random.choice(non_optimal)


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/move", methods=["POST"])
def move():
    data = request.get_json(silent=True) or {}
    board = list(data.get("board", [""] * 9))
    ai = data.get("ai", "X")
    human = data.get("human", "O")

    if len(board) != 9 or any(c not in ("", ai, human) for c in board):
        return jsonify({"error": "invalid board"}), 400

    winner, line = check_terminal(board)
    if winner is not None:
        return jsonify({
            "board": board,
            "aiMove": None,
            "winner": winner,
            "winningLine": line,
            "gameOver": True,
        })

    blunder = bool(data.get("blunder", False))
    idx = blunder_move(board, ai, human) if blunder else best_move(board, ai, human)
    if idx >= 0:
        board[idx] = ai

    winner, line = check_terminal(board)
    return jsonify({
        "board": board,
        "aiMove": idx,
        "winner": winner,
        "winningLine": line,
        "gameOver": winner is not None,
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
