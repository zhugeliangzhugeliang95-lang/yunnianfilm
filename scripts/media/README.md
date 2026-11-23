# YUNNIAN introduction video

`public/videos/yunnian-introduction.mp4` is a 22-second, 1280 × 720, 24 fps, intentionally silent product-image montage. The export is H.264/yuv420p with a fast-start MP4 header. `yunnian-introduction-poster.webp` is the matching opening composition.

The four scenes show the existing YUNNIAN branded sample wall, transparent PPF application, Metallic Dark Green panel detail, and Chameleon Aurora window-film image. They are animated photographs, not newly captured location footage, a factory tour, or a performance test. The source crop and gentle camera treatment preserve image proportions. No synthetic car scene, third-party music, numerical performance claim, or spoken endorsement is included.

Use the website's localized HTML to supply the company introduction and product labels. The video intentionally has no baked large heading, allowing the same file to serve English and Chinese pages.

## Reproduce

From the repository root, run `python3 scripts/media/render-intro.py` with Pillow and FFmpeg/FFprobe installed. `--preview-only` renders the poster and review frames without encoding the MP4. The source manifest records image hashes, dimensions, crops, and scene lengths. Outputs are deterministic at the declared frame rate; running the command replaces only this video's own generated outputs.

The encoded file passed complete stream decoding and the duration/codec/dimensions/frame-count checks. Representative encoded frames and transition frames were inspected. There is no audio track to review. Continuous playback should also be reviewed in the final homepage, where cropping, overlay contrast, autoplay, pause controls, reduced-motion behavior, and mobile layout are owned by the web integration.
