import { MDXProvider } from '@mdx-js/tag';
import GithubSlugger from 'github-slugger';
import { withRouter } from 'next/router';
import * as React from 'react';

import * as components from '~/common/translate-markdown';
import DocumentationPage from '~/components/DocumentationPage';
import { SluggerContext } from '~/components/page-higher-order/withSlugger';

export default meta =>
  withRouter(
    class DocumentationPageHOC extends React.Component {
      render() {
        const { router } = this.props;
        console.log('META', meta);
        return (
          <SluggerContext.Provider value={new GithubSlugger()}>
            <DocumentationPage
              title={meta.title}
              headings={meta.headings}
              url={router}
              asPath={router.asPath}
              sourceCodeUrl={meta.sourceCodeUrl}>
              <MDXProvider components={components}>{this.props.children}</MDXProvider>
            </DocumentationPage>
          </SluggerContext.Provider>
        );
      }
    }
  );
