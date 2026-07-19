export class StatusView {
  readonly #element: HTMLElement | null = document.getElementById('status');

  ready(): void {
    if (!this.#element) return;
    this.#element.classList.add('hidden');
    window.setTimeout(() => this.#element?.remove(), 500);
  }

  error(error: unknown): void {
    const message = error instanceof Error ? error.message : 'Неизвестная ошибка загрузки карты';
    console.error(error);
    if (!this.#element) return;
    this.#element.replaceChildren();
    const content = document.createElement('div');
    content.className = 'error';
    content.textContent = message;
    this.#element.append(content);
  }
}
