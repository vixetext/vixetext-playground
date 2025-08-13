
export const FILE_NAMES = ['Index.md', 'configuracao.yaml', 'referencias.bib'];

const INITIAL_MARKDOWN = `
# Introdução

Todos os artigos completos e pôsteres (artigos curtos) submetidos a alguma conferência da SBC,
incluindo quaisquer documentos de suporte, devem ser escritos em inglês ou em
português. O formato do artigo deve ser A4 com coluna única, 3,5 cm para margem
superior, 2,5 cm para margem inferior e 3,0 cm para margens laterais, sem
cabeçalhos ou rodapés. A fonte principal deve ser Times, tamanho nominal de 12 pontos, com 6
pontos de espaço antes de cada parágrafo. Os números de página devem ser suprimidos.

Os artigos completos devem respeitar os limites de páginas definidos pela conferência.
As conferências que publicam apenas resumos pedem textos de **uma** página.

# Primeira Página

A primeira página deve exibir o título do artigo, o nome e endereço dos
autores, o resumo em inglês e "resumo" em português ("resumos"
são obrigatórios apenas para artigos escritos em português). O título deve ser
centralizado em toda a página, em fonte 16 pontos em negrito e com 12
pontos de espaço antes de si mesmo. Os nomes dos autores devem ser centralizados em fonte 12 pontos,
em negrito, todos dispostos na mesma linha, separados por vírgulas
e com 12 pontos de espaço após o título. Os endereços devem ser centralizados
em fonte 12 pontos, também com 12 pontos de espaço após os nomes dos autores.
Os endereços de e-mail devem ser escritos usando fonte Courier New, tamanho nominal de 10 pontos,
com 6 pontos de espaço antes e 6 pontos de espaço depois.

O resumo e o "resumo" (se for o caso) devem estar em fonte Times 12 pontos,
com recuo de 0,8 cm em ambos os lados. A palavra **Resumo** e
**Resumo**, devem ser escritas em negrito e devem preceder o texto.

# CD-ROMs e Anais Impressos

Em algumas conferências, os artigos são publicados em CD-ROM, enquanto apenas o
resumo é publicado nos Anais impressos. Neste caso, os autores
são convidados a preparar duas versões finais do artigo. Uma, completa,
a ser publicada no CD e a outra, contendo apenas a primeira página,
com resumo e "resumo" (para artigos em português).

# Seções e Parágrafos

Os títulos das seções devem estar em negrito, 13pt, alinhados à esquerda. Deve haver um
espaço extra de 12pt antes de cada título. A numeração das seções é opcional.
O primeiro parágrafo de cada seção não deve ser recuado, enquanto as
primeiras linhas dos parágrafos subsequentes devem ser recuadas em 1,27 cm.

## Subseções

Os títulos das subseções devem estar em negrito, 12pt, alinhados à esquerda.

Em tabelas, tente evitar o uso de fundos coloridos ou sombreados, e evite
linhas de enquadramento grossas, duplas ou desnecessárias. Ao relatar dados empíricos,
não use mais dígitos decimais do que o garantido por sua precisão e
reprodutibilidade. A legenda da tabela deve ser colocada antes da tabela (veja a Tabela 1)
e a fonte usada também deve ser Helvética, 10 pontos, negrito, com 6 pontos de
espaço antes e depois de cada legenda.

\\begin{table}[ht]
\\centering
\\caption{Variables to be considered on the evaluation of interaction
  techniques}
\\label{tab:exTable1}
\\includegraphics[width=.7\\textwidth]{./imagens/table.jpg}
\\end{table}

# Imagens

Todas as imagens e ilustrações devem ser em preto e branco ou tons de cinza,
exceto os artigos que estarão disponíveis eletronicamente
(em CD-ROMs, internet, etc.). A resolução da imagem no papel deve ser
cerca de 600 dpi para imagens em preto e branco e 150-300 dpi para imagens em tons de cinza.
Não inclua imagens com resolução excessiva, pois elas podem
levar horas para imprimir, sem nenhuma diferença visível no resultado.

# Referências

As referências bibliográficas devem ser inequívocas e uniformes. Recomendamos
colocar os nomes dos autores entre colchetes, por exemplo, \\cite{knuth:84},
\\cite{boulic:91} e \\cite{smith:99}.

As referências devem ser listadas usando fonte de 12 pontos, com 6 pontos de
espaço antes de cada referência. A primeira linha de cada referência não deve
ser recuada, enquanto a subsequente deve ser recuada em 0,5 cm.
`;

const INITIAL_YAML = `instituicao: "Universidade/Faculdade do Brasil"
title: "Título do trabalho"
author:
  - Author 1 \\inst{1}
  - Author 2 \\inst{2}
email: "author.01@exemplo.com, author.02@exemplo.com"
palavras_chave: 'Pandoc. Ferramentas educacionais. CI/CD'
keywords: 'Pandoc. Educational tools. CI/CD'
abstract: |
  This meta-paper describes the style to be used in articles and short
  papers for SBC conferences. For papers in English, you should add just
  an abstract while for the papers in Portuguese, we also ask for an
  abstract in Portuguese ("resumo"). In both cases, abstracts should not
  have more than 10 lines and must be in the first page of the paper.
resumo: |
  Este meta-artigo descreve o estilo a ser usado na confecção de artigos e
  resumos de artigos para publicação nos anais das conferências
  organizadas pela SBC. É solicitada a escrita de resumo e abstract apenas
  para os artigos escritos em português. Artigos em inglês deverão
  apresentar apenas abstract. Nos dois casos, o autor deve tomar cuidado
  para que o resumo (e o abstract) não ultrapassem 10 linhas cada, sendo
  que ambos devem estar na primeira página do artigo.
address: "Estr. da Barragem - Jardim Campo Novo - CEP: 49400-000 - Lagarto - Sergipe - Brasil"
`;

const INITIAL_BIB = `
@Book{knuth:84,
  author = 	 {Donald E. Knuth},
  title = 	 {The {\\TeX} Book},
  publisher = 	 {Addison-Wesley},
  year = 	 {1984},
  edition = 	 {15th}
}

@InCollection{boulic:91,
  author = 	 {R. Boulic and O. Renault},
  title = 	 {3D Hierarchies for Animation},
  booktitle = 	 {New Trends in Animation and Visualization},
  publisher =    {John Wiley {\\&} Sons ltd.},
  year = 	 {1991},
  editor = 	 {Nadia Magnenat-Thalmann and Daniel Thalmann}
}

@InCollection{smith:99,
  author = 	 {A. Smith and B. Jones},
  title = 	 {On the Complexity of Computing},
  booktitle = 	 {Advances in Computer Science},
  pages = 	 {555--566},
  publisher =    {Publishing Press},
  year = 	 {1999},
  editor = 	 {A. B. Smith-Jones}
}
`;

export const INITIAL_FILE_CONTENTS: Record<string, string> = {
    [FILE_NAMES[0]]: INITIAL_MARKDOWN,
    [FILE_NAMES[1]]: INITIAL_YAML,
    [FILE_NAMES[2]]: INITIAL_BIB,
};
