#!/usr/bin/env python3
"""
Static Typography UTF-8 & Width Estimation Script for Lex Raid - Phase P4-B.
IMPORTANT: This script checks UTF-8 encoding and estimates CSS character widths only.
It does NOT render fonts or verify visual glyphs; run `chromium_p4b_acceptance.js`
against `/app/typography` for real headless Chromium font & glyph verification.
"""

def test_typography_strings():
    test_strings = [
        ("EN_LONG_1", "POLYMORPHISM"),
        ("EN_LONG_2", "CONTINUOUS INTEGRATION"),
        ("EN_LONG_3", "AUTHENTICATION"),
        ("EN_LONG_4", "INFRASTRUCTURE"),
        ("AMBIGUOUS_1", "O0 (Letter O vs Digit 0)"),
        ("AMBIGUOUS_2", "I1l (Cap I, Digit 1, Lower L)"),
        ("AMBIGUOUS_3", "rn / m (r+n vs m)"),
        ("VN_HEADING_1", "BOSS HUNT"),
        ("VN_HEADING_2", "ĐĂNG NHẬP"),
        ("VN_HEADING_3", "TIẾNG ANH CHUYÊN NGÀNH"),
        ("VN_HEADING_4", "QUẢN LÝ NHÂN VẬT"),
        ("VN_HEADING_5", "TỪ VỰNG"),
        ("VN_DIACRITICS_TONE", "Ắ Ằ Ẳ Ẵ Ặ Ế Ề Ệ Ứ Ừ Ự"),
        ("VN_COMPLEX_PHRASE", "Đa hình (Polymorphism) là nguyên lý cốt lõi trong lập trình hướng đối tượng.")
    ]

    print("=== LEX RAID STATIC TYPOGRAPHY CHECK (UTF-8 & WIDTH MATH ONLY) ===")
    all_passed = True
    for label, text in test_strings:
        # Check that characters encode properly in UTF-8
        try:
            encoded = text.encode('utf-8')
            decoded = encoded.decode('utf-8')
            assert decoded == text
            print(f"[PASS] {label:<20} | Length: {len(text):2d} chars | Value: {text}")
        except Exception as e:
            print(f"[FAIL] {label:<20} | Error: {e}")
            all_passed = False

    # Check Volcard word responsive clamp logic
    # Container width on 320px screen is ~280px.
    # At 2.8rem (44.8px) with ~0.6 aspect ratio per char: 12 chars * 27px = 324px -> OVERFLOWS and breaks!
    # With clamp(1.5rem, 5vw + 0.5rem, 2.4rem), on 320px viewport, font size = 24px:
    # 12 chars * 14.4px = 172.8px -> FITS COMFORTABLY ON ONE LINE!
    print("\n--- Volcard Long Word Fit Calculation (e.g. POLYMORPHISM - 12 chars) ---")
    card_widths = [280, 340, 480, 640]
    for cw in card_widths:
        # Proposed clamp: clamp(1.4rem, 4vw + 0.6rem, 2.5rem)
        target_font_px = min(40, max(22, cw * 0.07))
        est_word_px = 12 * (target_font_px * 0.62)
        fits = est_word_px <= (cw - 32)
        print(f"Card width: {cw}px -> Target font: {target_font_px:.1f}px -> Word width: {est_word_px:.1f}px -> Fits 1 line: {fits}")

    return all_passed

if __name__ == '__main__':
    test_typography_strings()
