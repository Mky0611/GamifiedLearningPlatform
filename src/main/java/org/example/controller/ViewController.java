package org.example.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ViewController {

    @GetMapping("/")
    public String root() {
        return "redirect:/app/home";
    }

    @GetMapping("/app/home")
    public String homePage() {
        return "redirect:/ui/src/pages/home.html";
    }

    @GetMapping("/app/auth")
    public String authPage() {
        return "redirect:/ui/src/pages/auth.html";
    }

    @GetMapping("/app/minigame")
    public String miniGamePage() {
        return "redirect:/ui/src/pages/minigame.html";
    }

    @GetMapping("/app/quiz")
    public String quizPage() {
        return "redirect:/ui/src/pages/quiz.html";
    }

    @GetMapping("/app/memory")
    public String memoryPage() {
        return "redirect:/ui/src/pages/memory.html";
    }

    @GetMapping("/app/speed-math")
    public String speedMathPage() {
        return "redirect:/ui/src/pages/speed-math.html";
    }

    @GetMapping("/app/code-puzzle")
    public String codePuzzlePage() {
        return "redirect:/ui/src/pages/code-puzzle.html";
    }

    @GetMapping("/app/volcard")
    public String volcardPage() {
        return "redirect:/ui/src/pages/volcard.html";
    }

    @GetMapping("/app/account")
    public String accountPage() {
        return "redirect:/ui/src/pages/account.html";
    }
}
